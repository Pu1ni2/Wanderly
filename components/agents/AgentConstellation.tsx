"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AgentIcon } from "./AgentIcon";
import { AGENTS, type AgentDef } from "./registry";
import { useAgentStatus } from "@/components/avatars/AgentStatusContext";
import type { AgentStatus } from "@/lib/types";

export function AgentConstellation() {
  const { statusOf, detailOf, ticker } = useAgentStatus();
  const [hovered, setHovered] = useState<string | null>(null);

  // Active = any agent currently working
  const activeCount = AGENTS.filter((a) => statusOf(a.name) === "started").length;
  const doneCount   = AGENTS.filter((a) => statusOf(a.name) === "done").length;

  // Find the most recent "started" entry for the now-line
  const latestStarted = [...ticker].reverse().find((e) => e.status === "started");
  const latestDone    = [...ticker].reverse().find((e) => e.status === "done");
  const featured = latestStarted ?? latestDone;
  const featuredAgent = featured ? AGENTS.find((a) => a.name === featured.agent) : undefined;

  return (
    <div
      className="relative rounded-3xl border bg-white overflow-hidden"
      style={{
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-md)",
        background: "linear-gradient(180deg, #ffffff 0%, #faf6ec 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Your team</div>
          <div className="font-display text-[20px] tracking-tight text-stone-900 mt-0.5">
            13 specialists, working together
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            {activeCount} active
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {doneCount} done
          </div>
        </div>
      </div>

      {/* Constellation — three concentric rows */}
      <div className="px-3 sm:px-5 py-4">
        <ConstellationRow label="Orchestration" agents={AGENTS.filter((a) => a.group === "orchestration")} statusOf={statusOf} hovered={hovered} setHovered={setHovered} />
        <div className="my-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[9px] uppercase tracking-[0.32em] text-stone-400">Specialists · parallel</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <ConstellationRow label="Specialists" agents={AGENTS.filter((a) => a.group === "specialist")} statusOf={statusOf} hovered={hovered} setHovered={setHovered} />
        <div className="my-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[9px] uppercase tracking-[0.32em] text-stone-400">Review</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <ConstellationRow label="Review" agents={AGENTS.filter((a) => a.group === "review")} statusOf={statusOf} hovered={hovered} setHovered={setHovered} />
      </div>

      {/* Featured live row */}
      <div className="relative px-5 py-4 border-t bg-stone-50/60" style={{ borderColor: "var(--border)" }}>
        <AnimatePresence mode="wait">
          {featuredAgent ? (
            <motion.div
              key={featured?.id ?? "noop"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3"
            >
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${featured?.status === "started" ? "animate-pulse" : ""}`}
                style={{ background: withAlpha(featuredAgent.accent, 0.12), color: featuredAgent.accent }}
              >
                <AgentIcon icon={featuredAgent.iconKey} color={featuredAgent.accent} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.24em]" style={{ color: featuredAgent.accent }}>
                    {featured?.status === "started" ? "now" : "just finished"}
                  </span>
                  <span className="text-[13px] font-medium text-stone-900">{featuredAgent.label}</span>
                </div>
                <div className="text-[13px] text-stone-700 truncate mt-0.5">
                  {featured?.detail ?? featuredAgent.role}
                </div>
              </div>
              {featuredAgent.source && (
                <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400 flex-shrink-0">{featuredAgent.source}</div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] text-stone-500 italic"
            >
              Specialists fire here when you speak or type. Every tool call shows up with its source.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ConstellationRow({
  agents,
  statusOf,
  hovered,
  setHovered,
}: {
  label: string;
  agents: AgentDef[];
  statusOf: (n: string) => AgentStatus | undefined;
  hovered: string | null;
  setHovered: (n: string | null) => void;
}) {
  return (
    <div className="flex items-start justify-center gap-3 sm:gap-5 flex-wrap">
      {agents.map((a) => (
        <Node
          key={a.name}
          agent={a}
          status={statusOf(a.name)}
          hovered={hovered === a.name}
          setHovered={(v) => setHovered(v ? a.name : null)}
        />
      ))}
    </div>
  );
}

function Node({
  agent,
  status,
  hovered,
  setHovered,
}: {
  agent: AgentDef;
  status: AgentStatus | undefined;
  hovered: boolean;
  setHovered: (v: boolean) => void;
}) {
  const isWorking = status === "started";
  const isDone = status === "done";
  const isError = status === "error";

  const ringColor =
    isError ? "#dc2626" :
    isWorking ? agent.accent :
    isDone ? "#10b981" :
    "transparent";

  const dotColor =
    isError ? "bg-red-500" :
    isWorking ? "bg-amber-400" :
    isDone ? "bg-emerald-500" :
    "bg-stone-300";

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: 72 }}
    >
      {/* Outer pulse ring while working */}
      {isWorking && (
        <motion.span
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: 64, height: 64, border: `2px solid ${agent.accent}` }}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Node circle */}
      <motion.div
        animate={{
          scale: isWorking ? 1.08 : hovered ? 1.04 : 1,
          boxShadow: isWorking
            ? `0 0 0 2px ${ringColor}, 0 12px 24px -10px ${withAlpha(agent.accent, 0.45)}`
            : isDone
              ? `0 0 0 2px ${ringColor}, 0 4px 10px -6px rgba(28,27,31,0.18)`
              : "0 4px 10px -6px rgba(28,27,31,0.16)",
        }}
        transition={{ duration: 0.25 }}
        className="relative h-16 w-16 rounded-full flex items-center justify-center"
        style={{
          background: isWorking
            ? `linear-gradient(180deg, ${withAlpha(agent.accent, 0.18)} 0%, ${withAlpha(agent.accent, 0.06)} 100%)`
            : "#ffffff",
          color: agent.accent,
        }}
      >
        <AgentIcon icon={agent.iconKey} color={agent.accent} size={28} />
        {/* Status dot top-right */}
        <span
          className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${dotColor}`}
        />
      </motion.div>

      {/* Label below */}
      <div className="mt-2 text-[10.5px] font-medium text-stone-700 text-center leading-tight max-w-[72px] truncate" title={agent.label}>
        {agent.label}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-20 w-[200px] rounded-xl border bg-white px-3 py-2 pointer-events-none"
            style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="text-[12px] font-medium text-stone-900">{agent.label}</div>
            <div className="text-[11px] text-stone-500 leading-snug">{agent.role}</div>
            {agent.source && <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400 mt-1">{agent.source}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
