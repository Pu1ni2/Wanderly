"use client";
import { motion } from "framer-motion";
import { AgentIcon } from "./AgentIcon";
import type { AgentDef } from "./registry";
import type { AgentStatus } from "@/lib/types";

interface Props {
  agent: AgentDef;
  status?: AgentStatus;
  detail?: string;
}

function statusMeta(status: AgentStatus | undefined) {
  switch (status) {
    case "started":
      return { label: "working", dot: "bg-amber-400", ring: "ring-amber-300/50" };
    case "done":
      return { label: "done", dot: "bg-emerald-500", ring: "ring-emerald-200" };
    case "error":
      return { label: "error", dot: "bg-red-500", ring: "ring-red-200" };
    default:
      return { label: "idle", dot: "bg-stone-300", ring: "" };
  }
}

export function AgentCard({ agent, status, detail }: Props) {
  const meta = statusMeta(status);
  const isWorking = status === "started";

  return (
    <motion.div
      layout
      animate={{
        scale: isWorking ? 1.015 : 1,
        boxShadow: isWorking
          ? `0 16px 36px -16px ${withAlpha(agent.accent, 0.35)}, 0 0 0 1px ${withAlpha(agent.accent, 0.35)}`
          : "0 4px 14px -10px rgba(28,27,31,0.18)",
      }}
      transition={{ duration: 0.25 }}
      className={`relative rounded-2xl bg-white p-4 ring-1 ring-stone-200/80 overflow-hidden ${isWorking ? "ring-2 " + meta.ring : ""}`}
    >
      {/* Subtle wash tinted by the accent when working */}
      {isWorking && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, ${withAlpha(agent.accent, 0.05)} 0%, transparent 60%)`,
        }} />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
          style={{
            background: withAlpha(agent.accent, 0.10),
            color: agent.accent,
          }}
        >
          <AgentIcon icon={agent.iconKey} color={agent.accent} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="font-display text-[15px] tracking-tight text-stone-900 truncate">{agent.label}</div>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{meta.label}</span>
          </div>
          <div className="text-[12px] leading-snug text-stone-600">{agent.role}</div>
        </div>
      </div>

      {/* Live data slot */}
      <div className="relative mt-3 rounded-lg bg-stone-50 px-3 py-2 min-h-[2.25rem] border border-stone-200/80 overflow-hidden">
        {isWorking && (
          <div className="absolute inset-0 shimmer" />
        )}
        {detail ? (
          <div className="relative flex items-center justify-between gap-2 text-[11px]">
            <div className="text-stone-700 truncate font-medium">{detail}</div>
            {agent.source && <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400 flex-shrink-0">{agent.source}</div>}
          </div>
        ) : (
          <div className="text-[11px] text-stone-400 italic">
            {agent.source ? `awaiting tasking · ${agent.source}` : "awaiting tasking"}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function withAlpha(hex: string, a: number) {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
