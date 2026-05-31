"use client";
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import type { AgentEvent, AgentStatus } from "@/lib/types";

interface AgentStatusContextValue {
  statusOf: (name: string) => AgentStatus | undefined;
  detailOf: (name: string) => string | undefined;
  push: (ev: AgentEvent) => void;
  reset: () => void;
  running: boolean;
  setRunning: (b: boolean) => void;
}

const Ctx = createContext<AgentStatusContextValue | null>(null);

export function AgentStatusProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, { status: AgentStatus; detail?: string }>>({});
  const [running, setRunning] = useState(false);

  const push = useCallback((ev: AgentEvent) => {
    setMap((prev) => ({ ...prev, [ev.agent]: { status: ev.status, detail: ev.detail } }));
  }, []);
  const reset = useCallback(() => setMap({}), []);

  const value = useMemo<AgentStatusContextValue>(() => ({
    statusOf: (n) => map[n]?.status,
    detailOf: (n) => map[n]?.detail,
    push,
    reset,
    running,
    setRunning,
  }), [map, push, reset, running]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgentStatus() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAgentStatus must be used within AgentStatusProvider");
  return v;
}
