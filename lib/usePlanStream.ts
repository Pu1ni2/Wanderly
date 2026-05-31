"use client";
import { useCallback, useRef, useState } from "react";
import type { AgentEvent, Itinerary, PlaceVisionResult } from "@/lib/types";

export interface SubmitArgs {
  query: string;
  budgetUSD?: number;
  imageDataUrl?: string;
  confirmedDestination?: string;
}

export interface FinalResult {
  itinerary: Itinerary;
  spokenSummary: string;
  attempts: number;
  verified: boolean;
}

interface Hooks {
  onAgentEvent?: (ev: AgentEvent) => void;
  onPlanStart?: () => void;
  onPlanFinish?: () => void;
  defaultDestination?: string;
}

export function usePlanStream({ onAgentEvent, onPlanStart, onPlanFinish, defaultDestination }: Hooks = {}) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [criticIssues, setCriticIssues] = useState<{ issues: string[]; attempt: number } | null>(null);
  const [vision, setVision] = useState<PlaceVisionResult | null>(null);
  const [pendingImage, setPendingImage] = useState<string | undefined>();
  const [pendingArgs, setPendingArgs] = useState<SubmitArgs | null>(null);
  const [final, setFinal] = useState<FinalResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetUSD, setBudgetUSD] = useState<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (args: SubmitArgs) => {
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

    const effectiveQuery = args.query || (defaultDestination ? `Plan a trip to ${defaultDestination}.` : "");

    try {
      const resp = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: effectiveQuery,
          budgetUSD: args.budgetUSD,
          imageDataUrl: args.imageDataUrl,
          confirmedDestination: args.confirmedDestination ?? defaultDestination,
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

    function handleEvent(ev: { type: string } & Record<string, unknown>) {
      switch (ev.type) {
        case "agent": {
          const agentEv: AgentEvent = {
            agent: ev.agent as string,
            status: ev.status as AgentEvent["status"],
            detail: ev.detail as string | undefined,
          };
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
  }, [defaultDestination, onAgentEvent, onPlanStart, onPlanFinish]);

  const confirmDestination = useCallback((choice: string) => {
    if (!pendingArgs) return;
    setVision(null);
    void start({ ...pendingArgs, confirmedDestination: choice });
  }, [pendingArgs, start]);

  return { events, criticIssues, vision, pendingImage, pendingArgs, final, running, error, budgetUSD, start, confirmDestination };
}
