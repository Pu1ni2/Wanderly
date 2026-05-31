"use client";
import { AgentCard } from "./AgentCard";
import { AGENTS_BY_GROUP } from "./registry";
import { useAgentStatus } from "@/components/avatars/AgentStatusContext";

export function AgentGrid() {
  const { statusOf, detailOf } = useAgentStatus();

  return (
    <div className="space-y-4">
      {/* Orchestration row */}
      <div>
        <GroupLabel>Orchestration</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AGENTS_BY_GROUP.orchestration.map((a) => (
            <AgentCard key={a.name} agent={a} status={statusOf(a.name)} detail={detailOf(a.name)} />
          ))}
        </div>
      </div>

      {/* Specialists */}
      <div>
        <GroupLabel>Specialists · run in parallel</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENTS_BY_GROUP.specialist.map((a) => (
            <AgentCard key={a.name} agent={a} status={statusOf(a.name)} detail={detailOf(a.name)} />
          ))}
        </div>
      </div>

      {/* Review */}
      <div>
        <GroupLabel>Review &amp; polish</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENTS_BY_GROUP.review.map((a) => (
            <AgentCard key={a.name} agent={a} status={statusOf(a.name)} detail={detailOf(a.name)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-stone-500">{children}</span>
      <span className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
