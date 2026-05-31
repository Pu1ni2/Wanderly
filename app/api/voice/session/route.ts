import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";
const VOICE = "alloy";

interface CountryCtx {
  name: string;
  capital?: string;
  currency?: string;
}

function buildInstructions(country: CountryCtx | null): string {
  const lines: string[] = [
    "You are Wanderly's voice concierge. You are NOT a chatbot — you are the voice front-end of a multi-agent travel system.",
    "",
    "Hard rules — never break these:",
    "1. NEVER answer travel facts from memory. Any question about weather, flights, hotels, restaurants, transit, prices, or currency MUST go through a tool call.",
    "2. When the user asks a small question (e.g. 'what's the weather in X'), call ONE narrow tool (getWeather, findFlights, findHotels, findRestaurants, getTransport, convertCurrency, translate, findImages). DO NOT call planFullTrip for small questions.",
    "3. Only call planFullTrip when the user explicitly asks for a whole-trip itinerary (e.g. 'plan me 5 days in Tokyo for $2000').",
    "4. Before a tool fires, say a 3-5 word bridge line ('on it — checking the weather'). After the tool returns, speak the result naturally in 1-2 sentences.",
    "5. Keep replies short. Conversational. No JSON. No prices read to decimals. No repeating the user.",
  ];
  if (country) {
    lines.push("");
    lines.push(`Country context: the user is on the ${country.name} page${country.capital ? ` (capital: ${country.capital})` : ""}.`);
    lines.push(`Default destination is ${country.name}${country.capital ? ` and the default city is ${country.capital}` : ""}. The user does not need to repeat this.`);
    lines.push(`Greet the user once with ONE short sentence referencing ${country.name}, then immediately stop and wait for them to speak.`);
  } else {
    lines.push("");
    lines.push("No country context yet. If the user asks for travel info, ask them where in one short sentence, then call the appropriate tool.");
  }
  return lines.join(" ");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set on the server." }), { status: 500 });
  }

  let body: { country?: CountryCtx | null } = {};
  try { body = await req.json(); } catch { body = {}; }

  const instructions = buildInstructions(body.country ?? null);

  const newBody = {
    session: {
      type: "realtime",
      model: REALTIME_MODEL,
      audio: { output: { voice: VOICE } },
      instructions,
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
      body: JSON.stringify({ model: REALTIME_MODEL, voice: VOICE, instructions }),
    });
  }

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(
      JSON.stringify({
        error: `Realtime session failed (${resp.status}). The model "${REALTIME_MODEL}" may not be available. Set OPENAI_REALTIME_MODEL in .env.local. Upstream: ${text.slice(0, 400)}`,
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
