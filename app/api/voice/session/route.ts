import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const REALTIME_MODEL = "gpt-realtime-2";
const VOICE = "alloy";

export async function POST(_req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), { status: 500 });
  }

  const instructions = [
    "You are Wanderly's voice concierge. You help users plan trips with a team of specialist agents.",
    "When the user asks you to plan a trip, ALWAYS call the planTrip tool with their query and budget. Do not invent itineraries on your own — the tool runs a verified multi-agent pipeline.",
    "While the tool runs, briefly say what's happening (e.g. 'on it — checking flights, hotels, and weather'). When the tool returns, give a warm 2-3 sentence summary of the itinerary, then say 'the full itinerary is on the screen'.",
    "Default to Japan as the destination if the user does not specify one. Be concise. Be warm. Don't read prices to many decimal places.",
  ].join(" ");

  // The current GA endpoint shape; OpenAI also accepts the older /realtime/sessions form.
  // Try the newer client_secrets endpoint first, fall back to the legacy one.
  const body = {
    session: {
      type: "realtime",
      model: REALTIME_MODEL,
      audio: { output: { voice: VOICE } },
      instructions,
    },
  };

  let resp = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Legacy fallback
  if (!resp.ok && (resp.status === 404 || resp.status === 400)) {
    resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: REALTIME_MODEL, voice: VOICE, instructions }),
    });
  }

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(JSON.stringify({ error: `realtime session failed: ${resp.status} ${text}` }), { status: 502 });
  }

  const data = await resp.json();

  // Normalize: both endpoints can return slightly different shapes
  const value: string | undefined = data?.value ?? data?.client_secret?.value;
  const expiresAt: number | undefined = data?.expires_at ?? data?.client_secret?.expires_at;
  if (!value) {
    return new Response(JSON.stringify({ error: "missing client_secret in response", raw: data }), { status: 502 });
  }

  return new Response(
    JSON.stringify({ clientSecret: value, expiresAt, model: REALTIME_MODEL }),
    { headers: { "Content-Type": "application/json" } }
  );
}
