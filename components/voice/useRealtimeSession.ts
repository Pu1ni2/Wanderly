"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "user-speaking"
  | "thinking"
  | "speaking"
  | "running-tool"
  | "paused"
  | "error";

export interface OnToolResult {
  itinerary?: unknown;
  error?: string;
}

export interface TranscriptItem {
  role: "user" | "assistant";
  text: string;
  /** True while streaming; false once committed. */
  partial?: boolean;
  id: string;
}

interface Options {
  onPlanTrip?: (args: { query: string; budgetUSD?: number }) => Promise<OnToolResult>;
  /** When true, auto-starts the session on mount. */
  autoStart?: boolean;
}

const TOOLS = [
  {
    type: "function",
    name: "planTrip",
    description:
      "Run the full multi-agent travel planning pipeline (orchestrator → planner → specialists → critic → writer). Returns a verified itinerary JSON. Call this for ANY trip planning request — do not invent an itinerary on your own.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The user's natural-language trip request, paraphrased." },
        budgetUSD: { type: "number", description: "Trip budget in US dollars, if the user gave one." },
      },
      required: ["query"],
    },
  },
];

export function useRealtimeSession({ onPlanTrip, autoStart = false }: Options = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [micLevel, setMicLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const onPlanTripRef = useRef(onPlanTrip);
  useEffect(() => { onPlanTripRef.current = onPlanTrip; }, [onPlanTrip]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { dcRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    dcRef.current = null;
    micStreamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setMicLevel(0);
    setState("idle");
  }, []);

  function startMicMeter() {
    if (!micStreamRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(micStreamRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setMicLevel(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // mic metering is non-critical; ignore failures
    }
  }

  const start = useCallback(async () => {
    setState((s) => (s === "idle" || s === "error" ? "connecting" : s));
    setError(null);
    try {
      const sessionResp = await fetch("/api/voice/session", { method: "POST" });
      if (!sessionResp.ok) throw new Error(`session: ${sessionResp.status} ${await sessionResp.text()}`);
      const { clientSecret, model } = await sessionResp.json();

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      let audioEl = audioRef.current;
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioRef.current = audioEl;
      }
      pc.ontrack = (e) => {
        if (audioEl) audioEl.srcObject = e.streams[0];
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = ms;
      ms.getTracks().forEach((t) => pc.addTrack(t, ms));
      startMicMeter();

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            tools: TOOLS,
            tool_choice: "auto",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: { type: "server_vad", threshold: 0.5, silence_duration_ms: 600 },
          },
        }));
        setState("listening");
      });

      dc.addEventListener("message", (e) => {
        try {
          const ev = JSON.parse(e.data);
          handleServerEvent(ev, dc);
        } catch {}
      });

      dc.addEventListener("close", () => setState("idle"));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      let sdpResp = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`, {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: `Bearer ${clientSecret}`, "Content-Type": "application/sdp" },
      });
      if (!sdpResp.ok && (sdpResp.status === 404 || sdpResp.status === 400)) {
        sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
          method: "POST",
          body: offer.sdp,
          headers: { Authorization: `Bearer ${clientSecret}`, "Content-Type": "application/sdp", "OpenAI-Beta": "realtime=v1" },
        });
      }
      if (!sdpResp.ok) throw new Error(`sdp: ${sdpResp.status} ${await sdpResp.text()}`);
      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      setError(String(err));
      setState("error");
      stop();
    }
  }, [stop]);

  const pause = useCallback(() => {
    micStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    micStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = true));
    setState("listening");
  }, []);

  function pushTranscript(item: TranscriptItem) {
    setTranscript((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [...prev, item];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }

  async function handleServerEvent(ev: { type?: string } & Record<string, unknown>, dc: RTCDataChannel) {
    if (!ev?.type) return;

    // ---- transcript handling ----
    if (ev.type === "conversation.item.input_audio_transcription.delta") {
      const id = (ev as { item_id?: string }).item_id ?? "user-active";
      const delta = (ev as { delta?: string }).delta ?? "";
      setTranscript((prev) => {
        const existing = prev.find((p) => p.id === id && p.role === "user");
        if (existing) {
          return prev.map((p) => p.id === id ? { ...p, text: p.text + delta, partial: true } : p);
        }
        return [...prev, { role: "user", text: delta, partial: true, id }];
      });
      return;
    }
    if (ev.type === "conversation.item.input_audio_transcription.completed") {
      const id = (ev as { item_id?: string }).item_id ?? "user-active";
      const t = (ev as { transcript?: string }).transcript ?? "";
      pushTranscript({ role: "user", text: t, partial: false, id });
      return;
    }
    if (ev.type === "response.output_audio_transcript.delta" || ev.type === "response.audio_transcript.delta") {
      const id = ((ev as { response_id?: string; item_id?: string }).item_id) ?? "assistant-active";
      const delta = (ev as { delta?: string }).delta ?? "";
      setTranscript((prev) => {
        const existing = prev.find((p) => p.id === id && p.role === "assistant");
        if (existing) {
          return prev.map((p) => p.id === id ? { ...p, text: p.text + delta, partial: true } : p);
        }
        return [...prev, { role: "assistant", text: delta, partial: true, id }];
      });
      return;
    }
    if (ev.type === "response.output_audio_transcript.done" || ev.type === "response.audio_transcript.done") {
      const id = ((ev as { item_id?: string }).item_id) ?? "assistant-active";
      setTranscript((prev) => prev.map((p) => p.id === id ? { ...p, partial: false } : p));
      return;
    }

    // ---- state machine ----
    switch (ev.type) {
      case "input_audio_buffer.speech_started":
        setState((s) => (s === "running-tool" || s === "paused" ? s : "user-speaking"));
        break;
      case "input_audio_buffer.speech_stopped":
        setState((s) => (s === "running-tool" || s === "paused" ? s : "thinking"));
        break;
      case "response.created":
        setState((s) => (s === "running-tool" ? s : "thinking"));
        break;
      case "output_audio_buffer.started":
      case "response.output_audio.delta":
        setState((s) => (s === "running-tool" ? s : "speaking"));
        break;
      case "output_audio_buffer.stopped":
      case "response.done":
        setState((s) => (s === "running-tool" || s === "paused" ? s : "listening"));
        break;
      case "response.function_call_arguments.done":
      case "response.output_item.done": {
        type ArgsDone = { name?: string; arguments?: string; call_id?: string };
        type ItemDone = { item?: { type?: string; name?: string; arguments?: string; call_id?: string } };
        const evA = ev as ArgsDone;
        const evI = ev as ItemDone;
        const name: string | undefined =
          evA.name ?? (evI.item?.type === "function_call" ? evI.item?.name : undefined);
        const rawArgs: string | undefined = evA.arguments ?? evI.item?.arguments;
        const callId: string | undefined = evA.call_id ?? evI.item?.call_id;
        if (!name || name !== "planTrip") return;
        setState("running-tool");
        let args: { query: string; budgetUSD?: number } = { query: "" };
        try { args = JSON.parse(rawArgs ?? "{}"); } catch {}
        const result = await onPlanTripRef.current?.(args) ?? { error: "no handler" };
        dc.send(JSON.stringify({
          type: "conversation.item.create",
          item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) },
        }));
        dc.send(JSON.stringify({ type: "response.create" }));
        setState("listening");
        break;
      }
    }
  }

  // Auto-start once
  const startedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [autoStart, start]);

  useEffect(() => () => stop(), [stop]);

  return { state, error, transcript, micLevel, start, stop, pause, resume };
}
