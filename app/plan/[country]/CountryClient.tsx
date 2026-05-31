"use client";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "@/components/ChatInput";
import { AgentActivity } from "@/components/AgentActivity";
import { ItineraryView } from "@/components/ItineraryView";
import { AgentStatusProvider, useAgentStatus } from "@/components/avatars/AgentStatusContext";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { usePlanStream } from "@/lib/usePlanStream";
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

export function CountryClient(props: Props) {
  return (
    <AgentStatusProvider>
      <Inner {...props} />
    </AgentStatusProvider>
  );
}

function Inner({ theme, placeholder, defaultDestination }: Props) {
  const { push, reset, setRunning } = useAgentStatus();
  const plan = usePlanStream({
    defaultDestination,
    onAgentEvent: push,
    onPlanStart: () => { reset(); setRunning(true); },
    onPlanFinish: () => setRunning(false),
  });

  const hasResult = Boolean(plan.final);

  return (
    <>
      <div className="mb-6">
        <VoicePanel
          accent={theme.accent}
          defaultDestination={defaultDestination}
          onPlanTrip={async (args) => {
            // Reuse the same stream the text input would
            await plan.start({ query: args.query, budgetUSD: args.budgetUSD });
            return { itinerary: { destination: defaultDestination, note: "Voice plan in progress" } };
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8">
        {/* Left column: input + side info */}
        <motion.div
          layout
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 order-2 lg:order-1"
        >
          <ChatInput
            onSubmit={plan.start}
            disabled={plan.running}
            placeholder={placeholder}
            accent={theme.accent}
          />

          {plan.vision && plan.pendingArgs && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-white p-4" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
              <div className="text-sm mb-2">
                I&apos;m only <span className="font-semibold">{Math.round(plan.vision.confidence * 100)}%</span> sure this is{" "}
                <span className="font-semibold">{plan.vision.guess}</span>. Pick one to continue:
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => plan.confirmDestination(plan.vision!.guess)} className="px-3 py-1.5 rounded-full text-white text-sm hover:opacity-95" style={{ backgroundColor: theme.accent }}>
                  {plan.vision.guess}
                </button>
                {plan.vision.alternates.map((alt) => (
                  <button key={alt} onClick={() => plan.confirmDestination(alt)} className="px-3 py-1.5 rounded-full bg-stone-50 border text-sm hover:bg-white" style={{ borderColor: "var(--border)" }}>
                    {alt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {plan.error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{plan.error}</div>
          )}

          <SideCard accent={theme.accent} />
        </motion.div>

        {/* Right column: 3D stage */}
        <motion.div
          layout
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-1 lg:order-2 lg:sticky lg:top-6 self-start"
        >
          <div className="relative">
            <AgentStage height={420} />
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.32em] text-stone-500">
              the team
            </div>
            {plan.running && (
              <div className="absolute top-3 right-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-red-700">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-700 pulse-dot" />
                planning
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Activity strip */}
      <AnimatePresence>
        {(plan.events.length > 0 || plan.running) && (
          <motion.div
            key="activity"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45 }}
            className="mt-6"
          >
            <AgentActivity events={plan.events} criticIssues={plan.criticIssues} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinerary */}
      <AnimatePresence>
        {hasResult && plan.final && (
          <motion.div
            key="itin"
            layout
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <ItineraryView
              itinerary={plan.final.itinerary}
              budgetUSD={plan.budgetUSD}
              attempts={plan.final.attempts}
              verified={plan.final.verified}
              spokenSummary={plan.final.spokenSummary || undefined}
              accent={theme.accent}
              displayFontClass={theme.fontDisplayClass}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}

function SideCard({ accent }: { accent: string }) {
  return (
    <div className="rounded-3xl border bg-white/70 backdrop-blur p-5" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10px] uppercase tracking-[0.32em] text-stone-500 mb-2">how the team works</div>
      <ol className="space-y-2.5 text-[13px] leading-relaxed text-stone-600">
        <Step n="01" body="Orchestrator reads your request and routes it to a planner." accent={accent} />
        <Step n="02" body="Planner fans out to specialists — flights, hotels, weather, food, transport — in parallel." accent={accent} />
        <Step n="03" body="Critic verifies every number against the live data and the budget you set." accent={accent} />
        <Step n="04" body="Writer hands you a clean, day-by-day itinerary you can act on." accent={accent} />
      </ol>
    </div>
  );
}

function Step({ n, body, accent }: { n: string; body: string; accent: string }) {
  return (
    <li className="flex gap-3">
      <span className="font-display text-[12px] tracking-tight pt-0.5" style={{ color: accent }}>{n}</span>
      <span>{body}</span>
    </li>
  );
}

function StageFallback() {
  return (
    <div className="rounded-3xl border bg-white" style={{ borderColor: "var(--border)", height: 420 }}>
      <div className="h-full flex items-center justify-center text-sm text-stone-500">
        Preparing the agent stage…
      </div>
    </div>
  );
}
