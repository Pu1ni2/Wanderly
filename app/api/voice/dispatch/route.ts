import { NextRequest } from "next/server";
import { dispatchTool, type ToolName } from "@/lib/tools";
import { ensureWeave } from "@/lib/weave";

export const runtime = "nodejs";
export const maxDuration = 30;

const SPECIALIST_TOOLS: Set<ToolName> = new Set([
  "weather",
  "currency",
  "translator",
  "images",
  "restaurants",
  "transport",
  "flights",
  "hotels",
]);

export async function POST(req: NextRequest) {
  await ensureWeave();
  let body: { name?: string; args?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 });
  }

  const name = body.name;
  if (!name || !SPECIALIST_TOOLS.has(name as ToolName)) {
    return new Response(JSON.stringify({ error: `unknown tool: ${name}` }), { status: 400 });
  }

  try {
    const result = await dispatchTool(name, body.args ?? {});
    return new Response(JSON.stringify({ result }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
