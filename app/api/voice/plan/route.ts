import { NextRequest } from "next/server";
import { orchestrate, type OrchestratorInput } from "@/lib/orchestrator";
import { ensureWeave } from "@/lib/weave";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  query: string;
  budgetUSD?: number;
  confirmedDestination?: string;
}

export async function POST(req: NextRequest) {
  await ensureWeave();
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 });
  }

  const input: OrchestratorInput = {
    query: body.query,
    budgetUSD: body.budgetUSD,
    confirmedDestination: body.confirmedDestination,
  };

  // Drain the generator to completion; we only return the final result for the voice agent
  // (the on-screen UI uses /api/plan for streaming).
  let result: unknown = null;
  let errorMsg: string | null = null;
  try {
    for await (const ev of orchestrate(input)) {
      if (ev.type === "result") result = ev;
      else if (ev.type === "error") errorMsg = ev.message;
    }
  } catch (err) {
    errorMsg = String(err);
  }

  if (errorMsg && !result) {
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
