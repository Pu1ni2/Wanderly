"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "running-tool" | "error";

export interface OnToolResult {
  itinerary?: unknown;
  error?: string;
}

interface Options {
  /**
   * Called when the realtime model invokes the planTrip tool.
   * Should perform the side-effect (e.g. trigger UI to show progress) and
   * return the JSON result that the model receives as the tool output.
   */
  onPlanTrip?: (args: { query: string; budgetUSD?: number }) => Promise<OnToolResult>;
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

export function useRealtimeSession({ onPlanTrip }: Options = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const onPlanTripRef = useRef(onPlanTrip);
  useEffect(() => { onPlanTripRef.current = onPlanTrip; }, [onPlanTrip]);

  const stop = useCallback(() => {
    try { dcRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    dcRef.current = null;
    micStreamRef.current = null;
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (state !== "idle" && state !== "error") return;
    setState("connecting");
    setError(null);
    try {
      const sessionResp = await fetch("/api/voice/session", { method: "POST" });
      if (!sessionResp.ok) throw new Error(`session: ${sessionResp.status} ${await sessionResp.text()}`);
      const { clientSecret, model } = await sessionResp.json();

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio output
      let audioEl = audioRef.current;
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioRef.current = audioEl;
      }
      pc.ontrack = (e) => {
        if (audioEl) audioEl.srcObject = e.streams[0];
      };

      // Mic input
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = ms;
      ms.getTracks().forEach((t) => pc.addTrack(t, ms));

      // Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        // Register tools and a sane system reminder
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            tools: TOOLS,
            tool_choice: "auto",
          },
        }));
        setState("listening");
      });

      dc.addEventListener("message", (e) => {
        try {
          const ev = JSON.parse(e.data);
          handleServerEvent(ev, dc);
        } catch {
          // ignore non-json frames
        }
      });

      dc.addEventListener("close", () => setState("idle"));

      // SDP exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // GA endpoint
      let sdpResp = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });
      // One-shot fallback to the legacy beta endpoint if GA isn't enabled on the account.
      if (!sdpResp.ok && (sdpResp.status === 404 || sdpResp.status === 400)) {
        sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            "Content-Type": "application/sdp",
            "OpenAI-Beta": "realtime=v1",
          },
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
  }, [state, stop]);

  async function handleServerEvent(ev: { type?: string } & Record<string, unknown>, dc: RTCDataChannel) {
    if (!ev?.type) return;
    switch (ev.type) {
      case "output_audio_buffer.started":
      case "response.output_audio.delta":
        setState((s) => (s === "running-tool" ? s : "speaking"));
        break;
      case "output_audio_buffer.stopped":
      case "response.done":
        setState((s) => (s === "running-tool" ? s : "listening"));
        break;
      case "input_audio_buffer.speech_started":
        setState((s) => (s === "running-tool" ? s : "listening"));
        break;
      case "response.function_call_arguments.done":
      case "response.output_item.done": {
        // The OpenAI realtime event shape can differ; handle both forms.
        type ArgsDone = { name?: string; arguments?: string; call_id?: string };
        type ItemDone = { item?: { type?: string; name?: string; arguments?: string; call_id?: string } };
        const evA = ev as ArgsDone;
        const evI = ev as ItemDone;
        const name: string | undefined =
          evA.name ?? (evI.item?.type === "function_call" ? evI.item?.name : undefined);
        const rawArgs: string | undefined = evA.arguments ?? evI.item?.arguments;
        const callId: string | undefined = evA.call_id ?? evI.item?.call_id;
        if (!name) return;
        if (name !== "planTrip") return;
        setState("running-tool");
        let args: { query: string; budgetUSD?: number } = { query: "" };
        try { args = JSON.parse(rawArgs ?? "{}"); } catch { /* keep defaults */ }
        const result = await onPlanTripRef.current?.(args) ?? { error: "no handler" };
        // Send function output back
        dc.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(result),
          },
        }));
        // Ask the model to continue (verbally describe the result)
        dc.send(JSON.stringify({ type: "response.create" }));
        setState("listening");
        break;
      }
    }
  }

  useEffect(() => () => stop(), [stop]);

  return { state, error, start, stop };
}
