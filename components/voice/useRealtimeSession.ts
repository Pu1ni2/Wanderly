"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/types";

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
  partial?: boolean;
  id: string;
}

export interface VoiceCountry {
  name: string;
  capital?: string;
  currency?: string;
  language?: string;
  greeting?: string;
}

interface Options {
  /** Called for the full-pipeline planTrip tool. */
  onPlanFullTrip?: (args: { query: string; budgetUSD?: number }) => Promise<OnToolResult>;
  /** Called when a granular specialist tool fires (started, then done/error). */
  onAgentEvent?: (ev: AgentEvent) => void;
  /** Country context passed to the session route + used as default destination. */
  country?: VoiceCountry | null;
  autoStart?: boolean;
}

// --- Tool definitions: 8 specialists + 1 full-pipeline ---
const TOOLS = [
  {
    type: "function",
    name: "getWeather",
    description: "Get a 7-day weather forecast for a city. Call this for ANY weather question — never answer from memory.",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
  {
    type: "function",
    name: "findFlights",
    description: "Find flight options between two airports/cities. Call this for any flight question.",
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string" },
        destination: { type: "string" },
        departDate: { type: "string", description: "YYYY-MM-DD" },
        returnDate: { type: "string", description: "YYYY-MM-DD" },
        travelers: { type: "integer", minimum: 1 },
      },
      required: ["origin", "destination"],
    },
  },
  {
    type: "function",
    name: "findHotels",
    description: "Find hotel options in a city with optional dates and nightly budget cap. Call this for any lodging question.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string" },
        checkinDate: { type: "string" },
        checkoutDate: { type: "string" },
        nights: { type: "integer", minimum: 1 },
        travelers: { type: "integer", minimum: 1 },
        maxNightlyUSD: { type: "number" },
      },
      required: ["city"],
    },
  },
  {
    type: "function",
    name: "findRestaurants",
    description: "Suggest restaurants in a city, optionally filtered by cuisine. Call this for any food / restaurant question.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string" },
        cuisine: { type: "string" },
        count: { type: "integer", minimum: 1, maximum: 6 },
      },
      required: ["city"],
    },
  },
  {
    type: "function",
    name: "getTransport",
    description: "Summarize local transit options for a city. Call this for any question about getting around.",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
  {
    type: "function",
    name: "convertCurrency",
    description: "Convert an amount between currencies. Call this for any FX or price-in-local-currency question.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number" },
        from: { type: "string", description: "ISO 4217 code" },
        to: { type: "string", description: "ISO 4217 code" },
      },
      required: ["amount", "from", "to"],
    },
  },
  {
    type: "function",
    name: "translate",
    description: "Translate a list of short travel phrases into a target language.",
    parameters: {
      type: "object",
      properties: {
        phrases: { type: "array", items: { type: "string" }, maxItems: 6 },
        targetLanguage: { type: "string" },
      },
      required: ["phrases", "targetLanguage"],
    },
  },
  {
    type: "function",
    name: "findImages",
    description: "Find a few illustrative images for a place or landmark.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" }, count: { type: "integer", minimum: 1, maximum: 5 } },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "planFullTrip",
    description: "Run the full multi-agent planning pipeline end-to-end (orchestrator → planner → all specialists → critic → writer). Only call this for explicit 'plan me a whole trip' requests — for narrow questions, use the specific specialist tool instead.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        budgetUSD: { type: "number" },
      },
      required: ["query"],
    },
  },
];

// Map external tool name → internal agent / specialist name
const TOOL_TO_AGENT: Record<string, string> = {
  getWeather: "weather",
  findFlights: "flights",
  findHotels: "hotels",
  findRestaurants: "restaurants",
  getTransport: "transport",
  convertCurrency: "currency",
  translate: "translator",
  findImages: "images",
  planFullTrip: "planner",
};

function shortDetail(name: string, args: Record<string, unknown>, result: unknown): string {
  const r = result as Record<string, unknown> | null;
  switch (name) {
    case "getWeather": {
      const s = (r as { summary?: string } | null)?.summary;
      return s ? `${args.city}: ${s.slice(0, 60)}` : `${args.city}`;
    }
    case "findFlights": {
      const opts = (r as { options?: Array<{ priceUSD: number }> } | null)?.options;
      if (!opts?.length) return `${args.origin} → ${args.destination}`;
      const prices = opts.map((o) => `$${o.priceUSD}`).join(", ");
      return `${args.origin} → ${args.destination}: ${prices}`;
    }
    case "findHotels": {
      const opts = (r as { options?: Array<{ nightlyUSD: number }> } | null)?.options;
      if (!opts?.length) return `${args.city}: no options`;
      const prices = opts.map((o) => `$${o.nightlyUSD}/n`).join(", ");
      return `${args.city}: ${prices}`;
    }
    case "findRestaurants": {
      const picks = (r as { picks?: Array<{ name: string }> } | null)?.picks;
      if (!picks?.length) return `${args.city}`;
      return `${args.city}: ${picks.slice(0, 2).map((p) => p.name).join(", ")}`;
    }
    case "getTransport": {
      return `${args.city}: ${(r as { summary?: string } | null)?.summary?.slice(0, 60) ?? "local transit"}`;
    }
    case "convertCurrency": {
      const converted = (r as { converted?: number } | null)?.converted;
      return `${args.amount} ${args.from} → ${converted} ${args.to}`;
    }
    case "translate": {
      const tr = (r as { translations?: Array<{ translation: string }> } | null)?.translations;
      return tr?.length ? `${tr.length} phrases → ${args.targetLanguage}` : `→ ${args.targetLanguage}`;
    }
    case "findImages": {
      const imgs = (r as { images?: unknown[] } | null)?.images;
      return `${args.query}: ${imgs?.length ?? 0} images`;
    }
    default:
      return JSON.stringify(args).slice(0, 80);
  }
}

export function useRealtimeSession({ onPlanFullTrip, onAgentEvent, country, autoStart = false }: Options = {}) {
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

  const onPlanRef = useRef(onPlanFullTrip);
  const onAgentRef = useRef(onAgentEvent);
  const countryRef = useRef(country);
  useEffect(() => { onPlanRef.current = onPlanFullTrip; }, [onPlanFullTrip]);
  useEffect(() => { onAgentRef.current = onAgentEvent; }, [onAgentEvent]);
  useEffect(() => { countryRef.current = country; }, [country]);

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
    } catch {}
  }

  const start = useCallback(async () => {
    setState((s) => (s === "idle" || s === "error" ? "connecting" : s));
    setError(null);
    try {
      const sessionResp = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryRef.current ?? null }),
      });
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

  async function handleServerEvent(ev: { type?: string } & Record<string, unknown>, dc: RTCDataChannel) {
    if (!ev?.type) return;

    // --- transcripts ---
    if (ev.type === "conversation.item.input_audio_transcription.delta") {
      const id = (ev as { item_id?: string }).item_id ?? "user-active";
      const delta = (ev as { delta?: string }).delta ?? "";
      setTranscript((prev) => {
        const existing = prev.find((p) => p.id === id && p.role === "user");
        if (existing) return prev.map((p) => p.id === id ? { ...p, text: p.text + delta, partial: true } : p);
        return [...prev, { role: "user", text: delta, partial: true, id }];
      });
      return;
    }
    if (ev.type === "conversation.item.input_audio_transcription.completed") {
      const id = (ev as { item_id?: string }).item_id ?? "user-active";
      const t = (ev as { transcript?: string }).transcript ?? "";
      setTranscript((prev) => {
        const idx = prev.findIndex((p) => p.id === id && p.role === "user");
        const next = { role: "user" as const, text: t, partial: false, id };
        if (idx === -1) return [...prev, next];
        const out = [...prev]; out[idx] = next; return out;
      });
      return;
    }
    if (ev.type === "response.output_audio_transcript.delta" || ev.type === "response.audio_transcript.delta") {
      const id = ((ev as { item_id?: string }).item_id) ?? "assistant-active";
      const delta = (ev as { delta?: string }).delta ?? "";
      setTranscript((prev) => {
        const existing = prev.find((p) => p.id === id && p.role === "assistant");
        if (existing) return prev.map((p) => p.id === id ? { ...p, text: p.text + delta, partial: true } : p);
        return [...prev, { role: "assistant", text: delta, partial: true, id }];
      });
      return;
    }
    if (ev.type === "response.output_audio_transcript.done" || ev.type === "response.audio_transcript.done") {
      const id = ((ev as { item_id?: string }).item_id) ?? "assistant-active";
      setTranscript((prev) => prev.map((p) => p.id === id ? { ...p, partial: false } : p));
      return;
    }

    // --- state machine ---
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
        if (!name) return;

        let args: Record<string, unknown> = {};
        try { args = JSON.parse(rawArgs ?? "{}"); } catch {}

        setState("running-tool");

        // planFullTrip — keep existing wiring
        if (name === "planFullTrip") {
          const result = await onPlanRef.current?.(args as { query: string; budgetUSD?: number }) ?? { error: "no handler" };
          dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) },
          }));
          dc.send(JSON.stringify({ type: "response.create" }));
          setState("listening");
          return;
        }

        // Granular specialist tools — dispatch and publish AgentEvents
        const agent = TOOL_TO_AGENT[name];
        if (!agent) {
          // Unknown tool — tell the model
          dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ error: `unknown tool: ${name}` }) },
          }));
          dc.send(JSON.stringify({ type: "response.create" }));
          setState("listening");
          return;
        }

        onAgentRef.current?.({ agent, status: "started", detail: shortRequest(name, args) });

        try {
          const resp = await fetch("/api/voice/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: agent, args }),
          });
          const payload = await resp.json();
          if (!resp.ok) throw new Error(payload?.error ?? `dispatch ${resp.status}`);
          const result = payload.result;
          onAgentRef.current?.({ agent, status: "done", detail: shortDetail(name, args, result) });
          dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) },
          }));
        } catch (err) {
          onAgentRef.current?.({ agent, status: "error", detail: String(err) });
          dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ error: String(err) }) },
          }));
        }

        dc.send(JSON.stringify({ type: "response.create" }));
        setState("listening");
        return;
      }
    }
  }

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

function shortRequest(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "getWeather":     return String(args.city ?? "");
    case "findFlights":    return `${args.origin ?? "?"} → ${args.destination ?? "?"}`;
    case "findHotels":     return String(args.city ?? "");
    case "findRestaurants":return `${args.city ?? ""}${args.cuisine ? " · " + args.cuisine : ""}`;
    case "getTransport":   return String(args.city ?? "");
    case "convertCurrency":return `${args.amount} ${args.from} → ${args.to}`;
    case "translate":      return `→ ${args.targetLanguage}`;
    case "findImages":     return String(args.query ?? "");
    default:               return JSON.stringify(args).slice(0, 60);
  }
}
