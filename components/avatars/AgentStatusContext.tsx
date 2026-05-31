"use client";
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import type { AgentEvent, AgentStatus } from "@/lib/types";

export interface TickerEntry {
  agent: string;
  status: AgentStatus;
  detail?: string;
  /** epoch ms */
  at: number;
  /** unique key for stable list rendering */
  id: string;
}

interface AgentStatusContextValue {
  statusOf: (name: string) => AgentStatus | undefined;
  detailOf: (name: string) => string | undefined;
  push: (ev: AgentEvent) => void;
  reset: () => void;
  running: boolean;
  setRunning: (b: boolean) => void;
  /** Last ~10 ticker entries, most recent last. */
  ticker: TickerEntry[];
}

const Ctx = createContext<AgentStatusContextValue | null>(null);

export function AgentStatusProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, { status: AgentStatus; detail?: string }>>({});
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [running, setRunning] = useState(false);

  const push = useCallback((ev: AgentEvent) => {
    setMap((prev) => ({ ...prev, [ev.agent]: { status: ev.status, detail: ev.detail } }));
    if (ev.status === "started" || ev.status === "done" || ev.status === "error") {
      setTicker((prev) => {
        const entry: TickerEntry = {
          agent: ev.agent,
          status: ev.status,
          detail: ev.detail,
          at: Date.now(),
          id: `${ev.agent}-${ev.status}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        const next = [...prev, entry];
        return next.length > 12 ? next.slice(next.length - 12) : next;
      });
    }
  }, []);
  const reset = useCallback(() => { setMap({}); setTicker([]); }, []);

  const value = useMemo<AgentStatusContextValue>(() => ({
    statusOf: (n) => map[n]?.status,
    detailOf: (n) => map[n]?.detail,
    push,
    reset,
    running,
    setRunning,
    ticker,
  }), [map, push, reset, running, ticker]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgentStatus() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAgentStatus must be used within AgentStatusProvider");
  return v;
}
