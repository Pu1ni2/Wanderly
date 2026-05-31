"use client";
import type { AgentEvent, AgentStatus } from "@/lib/types";

interface Props {
  events: AgentEvent[];
  criticIssues?: { issues: string[]; attempt: number } | null;
}

const META: Record<string, { label: string; group: "orchestration" | "specialist" | "review"; emoji?: string }> = {
  orchestrator: { label: "Orchestrator", group: "orchestration" },
  placeVision:  { label: "Place Vision", group: "orchestration" },
  planner:      { label: "Planner",      group: "orchestration" },
  critic:       { label: "Critic",       group: "review" },
  writer:       { label: "Writer",       group: "review" },
  weather:      { label: "Weather",      group: "specialist" },
  currency:     { label: "Currency",     group: "specialist" },
  translator:   { label: "Translator",   group: "specialist" },
  images:       { label: "Images",       group: "specialist" },
  restaurants:  { label: "Restaurants",  group: "specialist" },
  transport:    { label: "Transport",    group: "specialist" },
  flights:      { label: "Flights",      group: "specialist" },
  hotels:       { label: "Hotels",       group: "specialist" },
};

function statusColor(status: AgentStatus | undefined) {
  switch (status) {
    case "started": return "bg-indigo-500 pulse-dot";
    case "done":    return "bg-emerald-500";
    case "error":   return "bg-red-500";
    default:        return "bg-neutral-300 dark:bg-neutral-600";
  }
}

function statusLabel(status: AgentStatus | undefined): string {
  switch (status) {
    case "started": return "running";
    case "done":    return "done";
    case "error":   return "error";
    default:        return "idle";
  }
}

export function AgentActivity({ events, criticIssues }: Props) {
  // Roll up: the latest event per agent wins.
  const latestByAgent = new Map<string, AgentEvent>();
  for (const ev of events) latestByAgent.set(ev.agent, ev);

  const order = Array.from(latestByAgent.keys());
  const orchestration = order.filter((a) => META[a]?.group === "orchestration");
  const specialists  = order.filter((a) => META[a]?.group === "specialist");
  const review       = order.filter((a) => META[a]?.group === "review");

  if (orchestration.length + specialists.length + review.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-sm text-neutral-500">
        Agent activity will appear here once you submit a request.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-3 tracking-wide uppercase">Agent activity</h2>
      <div className="space-y-4">
        <AgentGroup title="Orchestration" agents={orchestration} latestByAgent={latestByAgent} />
        <AgentGroup title="Specialists (parallel)" agents={specialists} latestByAgent={latestByAgent} />
        <AgentGroup title="Review & polish" agents={review} latestByAgent={latestByAgent} />
        {criticIssues && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-sm">
            <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
              Critic found {criticIssues.issues.length} issue{criticIssues.issues.length === 1 ? "" : "s"} — re-planning (attempt {criticIssues.attempt + 1}/3)
            </div>
            <ul className="list-disc list-inside text-amber-900/90 dark:text-amber-100/90 space-y-0.5">
              {criticIssues.issues.slice(0, 4).map((iss, i) => <li key={i}>{iss}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentGroup({ title, agents, latestByAgent }: { title: string; agents: string[]; latestByAgent: Map<string, AgentEvent> }) {
  if (agents.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-medium text-neutral-500 mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {agents.map((name) => {
          const ev = latestByAgent.get(name);
          const meta = META[name] ?? { label: name, group: "specialist" as const };
          return (
            <div
              key={name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              title={ev?.detail}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${statusColor(ev?.status)}`} />
              <span className="text-sm font-medium">{meta.label}</span>
              <span className="text-xs text-neutral-500">{statusLabel(ev?.status)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
