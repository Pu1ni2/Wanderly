"use client";
import { useRef, useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { AgentActivity } from "@/components/AgentActivity";
import { ItineraryView } from "@/components/ItineraryView";
import type { AgentEvent, Itinerary, PlaceVisionResult } from "@/lib/types";
import type { Theme } from "@/lib/theme";

interface SubmitArgs {
  query: string;
  budgetUSD?: number;
  imageDataUrl?: string;
  confirmedDestination?: string;
}

interface Final {
  itinerary: Itinerary;
  spokenSummary: string;
  attempts: number;
  verified: boolean;
}

interface Props {
  theme: Theme;
  defaultPlaceholder?: string;
  initialDestination?: string;
  onAgentEvent?: (ev: AgentEvent) => void;
  onPlanStart?: () => void;
  onPlanFinish?: () => void;
}

export function PlanningExperience({ theme, defaultPlaceholder, initialDestination, onAgentEvent, onPlanStart, onPlanFinish }: Props) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [criticIssues, setCriticIssues] = useState<{ issues: string[]; attempt: number } | null>(null);
  const [vision, setVision] = useState<PlaceVisionResult | null>(null);
  const [pendingImage, setPendingImage] = useState<string | undefined>();
  const [pendingArgs, setPendingArgs] = useState<SubmitArgs | null>(null);
  const [final, setFinal] = useState<Final | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetUSD, setBudgetUSD] = useState<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  async function start(args: SubmitArgs) {
    setEvents([]);
    setCriticIssues(null);
    setVision(null);
    setFinal(null);
    setError(null);
    setBudgetUSD(args.budgetUSD);
    setPendingImage(args.imageDataUrl);
    setPendingArgs(args);
    setRunning(true);
    onPlanStart?.();

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const effectiveQuery = args.query || (initialDestination ? `Plan a trip to ${initialDestination}.` : "");

    try {
      const resp = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: effectiveQuery,
          budgetUSD: args.budgetUSD,
          imageDataUrl: args.imageDataUrl,
          confirmedDestination: args.confirmedDestination ?? initialDestination,
        }),
        signal: ctrl.signal,
      });
      if (!resp.body) throw new Error("no response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line));
        }
      }
      if (buffer.trim()) handleEvent(JSON.parse(buffer));
    } catch (err) {
      if (!ctrl.signal.aborted) setError(String(err));
    } finally {
      setRunning(false);
      onPlanFinish?.();
    }
  }

  function handleEvent(ev: { type: string } & Record<string, unknown>) {
    switch (ev.type) {
      case "agent": {
        const agentEv: AgentEvent = { agent: ev.agent as string, status: ev.status as AgentEvent["status"], detail: ev.detail as string | undefined };
        setEvents((prev) => [...prev, agentEv]);
        onAgentEvent?.(agentEv);
        break;
      }
      case "needsConfirmation":
        setVision(ev.vision as PlaceVisionResult);
        break;
      case "criticIssues":
        setCriticIssues({ issues: ev.issues as string[], attempt: ev.attempt as number });
        break;
      case "result":
        setFinal({
          itinerary: ev.itinerary as Itinerary,
          spokenSummary: ev.spokenSummary as string,
          attempts: ev.attempts as number,
          verified: ev.verified as boolean,
        });
        setCriticIssues(null);
        break;
      case "error":
        setError(ev.message as string);
        break;
    }
  }

  function confirmDestination(choice: string) {
    if (!pendingArgs) return;
    setVision(null);
    start({ ...pendingArgs, confirmedDestination: choice });
  }

  return (
    <div className="space-y-6">
      <ChatInput
        onSubmit={start}
        disabled={running}
        placeholder={defaultPlaceholder}
        accent={theme.accent}
      />

      {vision && pendingArgs && (
        <div className="rounded-3xl border bg-white p-4" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-sm mb-2">
            I&apos;m only <span className="font-semibold">{Math.round(vision.confidence * 100)}%</span> sure this is{" "}
            <span className="font-semibold">{vision.guess}</span>. Pick the right one to continue:
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => confirmDestination(vision.guess)} className="px-3 py-1.5 rounded-full text-white text-sm hover:opacity-95" style={{ backgroundColor: theme.accent }}>
              {vision.guess}
            </button>
            {vision.alternates.map((alt) => (
              <button key={alt} onClick={() => confirmDestination(alt)} className="px-3 py-1.5 rounded-full bg-[color:var(--bg)] border text-sm hover:bg-white" style={{ borderColor: "var(--border)" }}>
                {alt}
              </button>
            ))}
          </div>
          {pendingImage && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImage} alt="" className="h-24 rounded-lg border" style={{ borderColor: "var(--border)" }} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {(events.length > 0 || running) && <AgentActivity events={events} criticIssues={criticIssues} />}

      {final && (
        <ItineraryView
          itinerary={final.itinerary}
          budgetUSD={budgetUSD}
          attempts={final.attempts}
          verified={final.verified}
          spokenSummary={final.spokenSummary || undefined}
          accent={theme.accent}
          displayFontClass={theme.fontDisplayClass}
        />
      )}
    </div>
  );
}
