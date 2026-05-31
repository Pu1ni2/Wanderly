"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "@/components/ChatInput";
import { AgentActivity } from "@/components/AgentActivity";
import { ItineraryView } from "@/components/ItineraryView";
import { AgentStatusProvider, useAgentStatus } from "@/components/avatars/AgentStatusContext";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentLiveTicker } from "@/components/agents/AgentLiveTicker";
import { usePlanStream } from "@/lib/usePlanStream";
import type { Theme } from "@/lib/theme";

interface Props {
  theme: Theme;
  placeholder?: string;
  defaultDestination: string;
  capital?: string;
  language?: string;
  greeting?: string;
}

export function CountryClient(props: Props) {
  return (
    <AgentStatusProvider>
      <Inner {...props} />
    </AgentStatusProvider>
  );
}

function Inner({ theme, placeholder, defaultDestination, capital, language, greeting }: Props) {
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
      {/* Headline */}
      <div className="mb-6">
        <div className="font-display text-[22px] sm:text-[26px] tracking-tight text-stone-900 leading-snug">
          Watch the team work on your trip in real time.
        </div>
        <div className="text-[13px] text-stone-500 mt-1">
          Every fact is sourced from a specialist. Nothing is invented from memory.
        </div>
      </div>

      {/* Voice section */}
      <SectionLabel title="Talk to your concierge" subtitle="It routes your request to the right specialist — live." />
      <div className="mb-6">
        <VoicePanel
          accent={theme.accent}
          country={{ name: defaultDestination, capital, language, greeting }}
          defaultDestination={defaultDestination}
          onAgentEvent={(ev) => push(ev)}
          onPlanFullTrip={async (args) => {
            await plan.start({ query: args.query, budgetUSD: args.budgetUSD });
            return { itinerary: { destination: defaultDestination, note: "Voice plan in progress" } };
          }}
        />
      </div>

      {/* Live agent feed (ticker) */}
      <SectionLabel title="Live agent feed" subtitle="Every tool call your concierge makes shows up here, with its source." />
      <div className="mb-6">
        <AgentLiveTicker />
      </div>

      {/* Specialists grid + text-input column */}
      <SectionLabel title="Your team of specialists" subtitle="Nine agents that look up real data and verify each other." />
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8">
        {/* Left column: input + side info */}
        <motion.div
          layout
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 order-2 lg:order-1"
        >
          <div>
            <SectionLabel title="Plan in writing" subtitle="Type your request if you'd rather not speak." compact />
            <ChatInput
              onSubmit={plan.start}
              disabled={plan.running}
              placeholder={placeholder}
              accent={theme.accent}
            />
          </div>

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

        {/* Right column: agent grid */}
        <motion.div
          layout
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2"
        >
          <AgentGrid />
        </motion.div>
      </div>

      {/* Activity strip — full pipeline trace */}
      <AnimatePresence>
        {(plan.events.length > 0 || plan.running) && (
          <motion.div
            key="activity"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45 }}
            className="mt-8"
          >
            <SectionLabel title="Full pipeline trace" subtitle="The orchestrator → planner → critic loop, shown when you request a whole-trip plan." />
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
            <SectionLabel title="Your itinerary" subtitle="Verified by the critic before it reaches you." />
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

function SectionLabel({ title, subtitle, compact }: { title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={compact ? "mb-2" : "mb-3"}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-stone-500 font-medium">{title}</span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>
      {subtitle && !compact && (
        <div className="text-[12px] text-stone-500 mt-1 leading-snug">{subtitle}</div>
      )}
    </div>
  );
}

function SideCard({ accent }: { accent: string }) {
  return (
    <div className="rounded-3xl border bg-white/70 backdrop-blur p-5" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10px] uppercase tracking-[0.32em] text-stone-500 mb-2">how the team works</div>
      <ol className="space-y-2.5 text-[13px] leading-relaxed text-stone-600">
        <Step n="01" body="Voice or text routes to the right specialist in real time — every fact goes through a tool call, never invented from memory." accent={accent} />
        <Step n="02" body="Specialists run in parallel: flights, hotels, weather, food, transport, currency." accent={accent} />
        <Step n="03" body="Critic verifies every number against the live data and your budget." accent={accent} />
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
