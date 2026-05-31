"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeSession, type OnToolResult, type VoiceState } from "./useRealtimeSession";

interface Props {
  onPlanTrip?: (args: { query: string; budgetUSD?: number }) => Promise<OnToolResult>;
  defaultDestination?: string;
  variant?: "inline" | "slim";
  accent?: string;
}

export function VoicePanel({ onPlanTrip, defaultDestination, variant = "inline", accent = "#bd0029" }: Props) {
  const { state, error, transcript, micLevel, start, stop, pause, resume } = useRealtimeSession({
    onPlanTrip: async (args) => {
      const q = args.query || (defaultDestination ? `Plan a trip to ${defaultDestination}` : "");
      const local = onPlanTrip ? await onPlanTrip({ query: q, budgetUSD: args.budgetUSD }) : null;
      if (local) return local;
      const resp = await fetch("/api/voice/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, budgetUSD: args.budgetUSD, confirmedDestination: defaultDestination }),
      });
      if (!resp.ok) return { error: `plan API ${resp.status}` };
      return (await resp.json()) as OnToolResult;
    },
  });

  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!transcriptRef.current) return;
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  const active = state !== "idle" && state !== "error";
  const headline = labelFor(state);

  if (variant === "slim") {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[min(680px,calc(100vw-2rem))] w-full">
        <div className="rounded-full border bg-white/90 backdrop-blur-xl px-3 py-2 flex items-center gap-3" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <BreathingRing state={state} micLevel={micLevel} accent={accent} small />
          <div className="text-[13px] text-stone-700 font-medium truncate flex-1">{headline}</div>
          {state === "idle" ? (
            <button onClick={start} className="text-[12px] px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: accent }}>
              Start speaking
            </button>
          ) : state === "paused" ? (
            <button onClick={resume} className="text-[12px] px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: accent }}>
              Resume
            </button>
          ) : (
            <button onClick={pause} className="text-[12px] px-3 py-1.5 rounded-full border bg-white hover:bg-stone-50" style={{ borderColor: "var(--border)" }}>
              Pause
            </button>
          )}
          {active && (
            <button onClick={stop} className="text-[11px] text-stone-500 hover:text-stone-900 px-2">end</button>
          )}
        </div>
        {error && <ErrorRow text={error} />}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-white/85 backdrop-blur-xl overflow-hidden" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
      <div className="p-5 sm:p-6 flex items-start gap-5">
        <BreathingRing state={state} micLevel={micLevel} accent={accent} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.3em] text-stone-500 mb-1">Voice concierge</div>
          <div className="font-display text-xl tracking-tight text-stone-900 mb-1">{headline}</div>
          <div className="text-[13px] text-stone-600 leading-relaxed">
            {state === "idle"
              ? <>Tap <em className="not-italic font-medium" style={{ color: accent }}>Start</em> once — after that, just speak. The model listens continuously and replies in voice.</>
              : "Say something like “plan me four days in Lisbon for two thousand dollars.”"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state === "idle" || state === "error" ? (
            <button onClick={start} className="text-sm font-medium px-4 py-2 rounded-full text-white hover:opacity-95 transition" style={{ backgroundColor: accent }}>
              Start
            </button>
          ) : state === "paused" ? (
            <button onClick={resume} className="text-sm font-medium px-4 py-2 rounded-full text-white" style={{ backgroundColor: accent }}>
              Resume
            </button>
          ) : (
            <>
              <button onClick={pause} className="text-sm px-4 py-2 rounded-full border bg-white hover:bg-stone-50 transition" style={{ borderColor: "var(--border)" }}>
                Pause
              </button>
              <button onClick={stop} className="text-sm px-3 py-2 rounded-full text-stone-500 hover:text-stone-900">
                End
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {transcript.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t bg-stone-50/60"
            style={{ borderColor: "var(--border)" }}
          >
            <div ref={transcriptRef} className="max-h-44 overflow-y-auto px-5 sm:px-6 py-4 space-y-2">
              {transcript.map((line) => (
                <div key={line.id} className="text-[13px] leading-relaxed">
                  <span className="text-[10px] uppercase tracking-[0.22em] mr-2" style={{ color: line.role === "user" ? "#5b5963" : accent }}>
                    {line.role === "user" ? "you" : "concierge"}
                  </span>
                  <span className={line.partial ? "text-stone-500" : "text-stone-900"}>
                    {line.text}{line.partial && <span className="inline-block w-1.5 h-3 ml-0.5 align-middle bg-stone-400 animate-pulse" />}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <ErrorRow text={error} />}
    </div>
  );
}

function BreathingRing({ state, micLevel, accent, small = false }: { state: VoiceState; micLevel: number; accent: string; small?: boolean }) {
  const size = small ? 32 : 56;
  const dot = small ? 8 : 14;
  const isActive = state === "listening" || state === "user-speaking";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking" || state === "running-tool";
  const isPaused = state === "paused";
  const isError = state === "error";

  const ringColor =
    isError ? "#dc2626" :
    isPaused ? "#a8a29e" :
    isThinking ? "#a16207" :
    isSpeaking ? accent :
    isActive ? accent :
    "#a8a29e";

  const ringScale = 1 + (isActive ? micLevel * 0.8 : isSpeaking ? 0.25 : 0);
  const ringOpacity = isError ? 0.4 : (state === "idle" ? 0.25 : 0.7);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <motion.span
        animate={{ scale: ringScale, opacity: ringOpacity }}
        transition={{ duration: 0.08, ease: "linear" }}
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${ringColor}` }}
      />
      <motion.span
        animate={{ scale: isThinking ? [1, 1.35, 1] : isSpeaking ? [1, 1.15, 1] : 1, opacity: isThinking ? [0.4, 0, 0.4] : 0.3 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${ringColor}` }}
      />
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: dot,
          height: dot,
          backgroundColor: isError ? "#dc2626" : isPaused ? "#a8a29e" : accent,
          boxShadow: isActive || isSpeaking ? `0 0 14px ${ringColor}` : "none",
        }}
      />
    </div>
  );
}

function labelFor(state: VoiceState): string {
  switch (state) {
    case "idle": return "Tap Start to talk";
    case "connecting": return "Connecting to the concierge…";
    case "listening": return "Listening — go ahead";
    case "user-speaking": return "I hear you…";
    case "thinking": return "Thinking";
    case "running-tool": return "Planning your trip";
    case "speaking": return "Concierge is speaking";
    case "paused": return "Paused — tap Resume to keep going";
    case "error": return "Voice error — try Start again";
  }
}

function ErrorRow({ text }: { text: string }) {
  return (
    <div className="border-t bg-red-50 px-5 py-2 text-[11px] text-red-800" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
      {text}
    </div>
  );
}
