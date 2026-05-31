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
      return { label: "working", dot: "bg-amber-400", pillBg: "bg-amber-50", pillText: "text-amber-800", pillBorder: "border-amber-200" };
    case "done":
      return { label: "done",    dot: "bg-emerald-500", pillBg: "bg-emerald-50", pillText: "text-emerald-800", pillBorder: "border-emerald-200" };
    case "error":
      return { label: "error",   dot: "bg-red-500", pillBg: "bg-red-50", pillText: "text-red-800", pillBorder: "border-red-200" };
    default:
      return { label: "idle",    dot: "bg-stone-300", pillBg: "bg-stone-50", pillText: "text-stone-500", pillBorder: "border-stone-200" };
  }
}

export function AgentCard({ agent, status, detail }: Props) {
  const meta = statusMeta(status);
  const isWorking = status === "started";

  return (
    <motion.div
      layout
      animate={{
        scale: isWorking ? 1.012 : 1,
        boxShadow: isWorking
          ? `0 18px 40px -16px ${withAlpha(agent.accent, 0.40)}, 0 0 0 2px ${withAlpha(agent.accent, 0.45)}`
          : "0 4px 14px -10px rgba(28,27,31,0.16)",
      }}
      transition={{ duration: 0.28 }}
      className="relative rounded-2xl bg-white p-4 ring-1 ring-stone-200/70 overflow-hidden min-h-[160px] flex flex-col"
    >
      {/* Subtle wash tinted by accent while working */}
      {isWorking && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, ${withAlpha(agent.accent, 0.06)} 0%, transparent 55%)`,
        }} />
      )}

      {/* Top row: icon left, status pill right */}
      <div className="relative flex items-start justify-between">
        <div
          className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${isWorking ? "animate-pulse" : ""}`}
          style={{
            background: withAlpha(agent.accent, 0.12),
            color: agent.accent,
          }}
        >
          <AgentIcon icon={agent.iconKey} color={agent.accent} size={24} />
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-[0.18em] ${meta.pillBg} ${meta.pillText} ${meta.pillBorder}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </div>
      </div>

      {/* Name on its own line, full width — never truncates */}
      <div className="relative mt-3">
        <div className="font-display text-[16px] tracking-tight text-stone-900 leading-tight">
          {agent.label}
        </div>
        <div className="text-[12px] leading-snug text-stone-600 mt-1">
          {agent.role}
        </div>
      </div>

      {/* Live data slot — full width below */}
      <div className="relative mt-3 rounded-lg bg-stone-50 px-3 py-2 min-h-[2.5rem] border border-stone-200/80 overflow-hidden flex-1 flex items-center">
        {isWorking && <div className="absolute inset-0 shimmer" />}
        {detail ? (
          <div className="relative w-full">
            <div className="text-[12px] text-stone-800 font-medium leading-snug">{detail}</div>
            {agent.source && <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400 mt-0.5">{agent.source}</div>}
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
