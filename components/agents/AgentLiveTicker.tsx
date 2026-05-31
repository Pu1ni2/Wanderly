"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStatus, type TickerEntry } from "@/components/avatars/AgentStatusContext";
import { AGENTS } from "./registry";

const BY_NAME = Object.fromEntries(AGENTS.map((a) => [a.name, a]));

export function AgentLiveTicker() {
  const { ticker } = useAgentStatus();
  // Only show the last 4 "done"/"error" + the latest "started"
  const recent = ticker.slice(-4).reverse();

  return (
    <div className="rounded-2xl border bg-white/85 backdrop-blur-xl p-4" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Live agent feed</div>
        <div className="text-[10px] text-stone-400">{recent.length === 0 ? "waiting for first call…" : `${ticker.length} call${ticker.length === 1 ? "" : "s"}`}</div>
      </div>
      <div className="space-y-1.5 min-h-[3.5rem]">
        <AnimatePresence initial={false}>
          {recent.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] text-stone-400 italic"
            >
              Specialists fire here when you ask a question. Every claim is sourced.
            </motion.div>
          ) : (
            recent.map((e) => <TickerRow key={e.id} entry={e} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TickerRow({ entry }: { entry: TickerEntry }) {
  const meta = BY_NAME[entry.agent];
  const accent = meta?.accent ?? "#1c1b1f";
  const dot =
    entry.status === "done" ? "bg-emerald-500" :
    entry.status === "error" ? "bg-red-500" :
    "bg-amber-400";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex items-center gap-3 text-[12px] leading-tight"
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="font-medium text-stone-900 w-[6.5rem] flex-shrink-0 truncate" style={{ color: accent }}>
        {meta?.label ?? entry.agent}
      </span>
      <span className="text-stone-600 flex-1 truncate">{entry.detail ?? (entry.status === "started" ? "calling…" : "")}</span>
      <span className="text-stone-400 flex-shrink-0 text-[10px] font-mono">{relTime(entry.at)}</span>
    </motion.div>
  );
}

function relTime(t: number): string {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 1) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m`;
}
