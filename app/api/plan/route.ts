import { NextRequest } from "next/server";
import { orchestrate, type OrchestratorInput } from "@/lib/orchestrator";
import { ensureWeave } from "@/lib/weave";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  await ensureWeave();
  let body: OrchestratorInput;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of orchestrate(body)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: String(err) }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
