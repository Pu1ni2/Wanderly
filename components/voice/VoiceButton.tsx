"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeSession, type OnToolResult } from "./useRealtimeSession";

interface Props {
  onPlanTrip?: (args: { query: string; budgetUSD?: number }) => Promise<OnToolResult>;
  defaultDestination?: string;
}

export function VoiceButton({ onPlanTrip, defaultDestination }: Props) {
  const { state, error, start, stop } = useRealtimeSession({
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

  const [hover, setHover] = useState(false);

  const active = state !== "idle" && state !== "error";
  const label =
    state === "connecting" ? "connecting…" :
    state === "listening"  ? "listening — speak naturally" :
    state === "speaking"   ? "concierge is speaking" :
    state === "running-tool" ? "planning your trip" :
    state === "error"      ? "voice error" :
    "Talk to your concierge";

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <AnimatePresence>
        {(hover || active) && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="rounded-full bg-white border px-3 py-1.5 text-xs shadow-sm"
            style={{ borderColor: "var(--border)" }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (active ? stop() : start())}
        className="relative h-14 w-14 rounded-full text-white shadow-lg flex items-center justify-center transition"
        style={{
          backgroundColor: active ? "var(--accent)" : "var(--ink)",
          boxShadow: active ? "0 0 0 8px rgba(189,0,41,0.12)" : "var(--shadow-lg)",
        }}
        aria-label={active ? "Stop voice" : "Start voice"}
      >
        {active && (
          <span className="absolute inset-0 rounded-full" style={{ background: "var(--accent)", opacity: 0.4, animation: "pulse-dot 1.4s ease-in-out infinite" }} />
        )}
        <MicIcon className="relative h-6 w-6" />
      </button>
      {error && (
        <div className="max-w-[14rem] rounded-lg bg-red-50 text-red-800 text-[11px] px-2 py-1 border border-red-200">{error}</div>
      )}
    </div>
  );
}

function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 1.5a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0v-7a3 3 0 0 0-3-3z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}
