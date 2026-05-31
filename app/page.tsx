"use client";
import { useRef, useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { AgentActivity } from "@/components/AgentActivity";
import { ItineraryView } from "@/components/ItineraryView";
import type { AgentEvent, Itinerary, PlaceVisionResult } from "@/lib/types";

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

export default function Home() {
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

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: args.query,
          budgetUSD: args.budgetUSD,
          imageDataUrl: args.imageDataUrl,
          confirmedDestination: args.confirmedDestination,
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
    }
  }

  function handleEvent(ev: { type: string } & Record<string, unknown>) {
    switch (ev.type) {
      case "agent":
        setEvents((prev) => [...prev, { agent: ev.agent as string, status: ev.status as AgentEvent["status"], detail: ev.detail as string | undefined }]);
        break;
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">W</div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Wanderly</h1>
          </div>
          <p className="text-sm text-neutral-500">A team of AI agents that plans, verifies, and self-corrects your trip.</p>
        </header>

        <ChatInput onSubmit={start} disabled={running} />

        {vision && pendingArgs && (
          <div className="mt-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
            <div className="text-sm mb-2">
              I&apos;m only <span className="font-semibold">{Math.round(vision.confidence * 100)}%</span> sure this is{" "}
              <span className="font-semibold">{vision.guess}</span>. Pick the right one to continue:
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => confirmDestination(vision.guess)} className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700">
                {vision.guess}
              </button>
              {vision.alternates.map((alt) => (
                <button key={alt} onClick={() => confirmDestination(alt)} className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  {alt}
                </button>
              ))}
            </div>
            {pendingImage && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingImage} alt="" className="h-24 rounded-lg border border-neutral-200 dark:border-neutral-700" />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {(events.length > 0 || running) && <AgentActivity events={events} criticIssues={criticIssues} />}
          {final && (
            <ItineraryView
              itinerary={final.itinerary}
              budgetUSD={budgetUSD}
              attempts={final.attempts}
              verified={final.verified}
              spokenSummary={final.spokenSummary || undefined}
            />
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-neutral-400">
          Built for a multi-agent hackathon. Plan, verify, self-correct.
        </footer>
      </div>
    </div>
  );
}
