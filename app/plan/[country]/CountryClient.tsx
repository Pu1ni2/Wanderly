"use client";
import dynamic from "next/dynamic";
import { PlanningExperience } from "@/components/plan/PlanningExperience";
import { AgentStatusProvider, useAgentStatus } from "@/components/avatars/AgentStatusContext";
import { VoiceButton } from "@/components/voice/VoiceButton";
import type { Theme } from "@/lib/theme";

const AgentStage = dynamic(
  () => import("@/components/avatars/AgentStage").then((m) => m.AgentStage),
  { ssr: false, loading: () => <StageFallback /> }
);

interface Props {
  theme: Theme;
  placeholder?: string;
  defaultDestination: string;
}

export function CountryClient({ theme, placeholder, defaultDestination }: Props) {
  return (
    <AgentStatusProvider>
      <div className="space-y-6">
        <AgentStage height={340} />
        <PlanningWithStatus theme={theme} placeholder={placeholder} defaultDestination={defaultDestination} />
      </div>
      <VoiceButton defaultDestination={defaultDestination} />
    </AgentStatusProvider>
  );
}

function PlanningWithStatus({ theme, placeholder, defaultDestination }: Props) {
  const { push, reset, setRunning } = useAgentStatus();
  return (
    <PlanningExperience
      theme={theme}
      defaultPlaceholder={placeholder}
      initialDestination={defaultDestination}
      onPlanStart={() => { reset(); setRunning(true); }}
      onPlanFinish={() => setRunning(false)}
      onAgentEvent={(ev) => push(ev)}
    />
  );
}

function StageFallback() {
  return (
    <div className="rounded-3xl border bg-white" style={{ borderColor: "var(--border)", height: 340 }}>
      <div className="h-full flex items-center justify-center text-sm text-[color:var(--ink-faint)]">
        Preparing the agent stage…
      </div>
    </div>
  );
}
