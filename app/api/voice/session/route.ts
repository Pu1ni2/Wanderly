import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// User asked for "gpt-realtime-2" — the actual GA model id is `gpt-realtime`.
// Allow override via env so this is easy to flip without a code change.
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";
const VOICE = "alloy";

const INSTRUCTIONS = [
  "You are Wanderly's voice concierge — warm, sharp, concise. Think Apple-store specialist, not airline IVR.",
  "When the user asks you to plan a trip, ALWAYS call the planTrip tool with their query and budget. Do NOT invent itineraries. The tool runs a verified multi-agent pipeline.",
  "Before calling the tool say a short bridge line like: 'on it — checking flights, hotels, and the weather'.",
  "After the tool returns, give a warm 2-3 sentence summary of the itinerary (no prices read to decimals), then say 'the full plan is on screen'.",
  "If the user does not specify a destination, default to Japan.",
  "Never read JSON. Never repeat the user's question back. Keep replies under three sentences unless asked for more.",
].join(" ");

export async function POST(_req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set on the server." }), { status: 500 });
  }

  // Try the newer client_secrets endpoint first, fall back to legacy /sessions.
  const newBody = {
    session: {
      type: "realtime",
      model: REALTIME_MODEL,
      audio: { output: { voice: VOICE } },
      instructions: INSTRUCTIONS,
    },
  };
  let resp = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(newBody),
  });

  if (!resp.ok && (resp.status === 404 || resp.status === 400)) {
    resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: REALTIME_MODEL, voice: VOICE, instructions: INSTRUCTIONS }),
    });
  }

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(
      JSON.stringify({
        error: `Realtime session failed (${resp.status}). The model "${REALTIME_MODEL}" may not be available on this account. Set OPENAI_REALTIME_MODEL in .env.local to a valid model id and restart. Upstream: ${text.slice(0, 400)}`,
      }),
      { status: 502 }
    );
  }

  const data = await resp.json();
  const value: string | undefined = data?.value ?? data?.client_secret?.value;
  const expiresAt: number | undefined = data?.expires_at ?? data?.client_secret?.expires_at;
  if (!value) {
    return new Response(JSON.stringify({ error: "missing client_secret in upstream response", raw: data }), { status: 502 });
  }

  return new Response(
    JSON.stringify({ clientSecret: value, expiresAt, model: REALTIME_MODEL }),
    { headers: { "Content-Type": "application/json" } }
  );
}
