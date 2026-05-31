import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";
const VOICE = "alloy";

interface CountryCtx {
  name: string;
  capital?: string;
  currency?: string;
  language?: string;
  greeting?: string;
}

function buildInstructions(country: CountryCtx | null): string {
  const lines: string[] = [
    "You are Wanderly's voice concierge. You are NOT a chatbot — you are the voice front-end of a multi-agent travel system.",
    "",
    "Hard rules — never break these:",
    "1. NEVER answer travel facts from memory. Any question about weather, flights, hotels, restaurants, transit, prices, or currency MUST go through a tool call.",
    "2. When the user asks a small question (e.g. 'what's the weather in X'), call ONE narrow tool (getWeather, findFlights, findHotels, findRestaurants, getTransport, convertCurrency, translate, findImages). DO NOT call planFullTrip for small questions.",
    "3. Only call planFullTrip when the user has given enough information: destination, origin city, approximate duration, and (ideally) budget. If any are missing for a whole-trip request, ASK ONE concise follow-up before firing the tool.",
    "4. Follow-up priority order: origin city first, then trip length (days), then budget. Ask ONE question per turn — never pile up. After the user answers, proceed with the tool call, even if details are still loose.",
    "5. For narrow tools, if a critical parameter is missing (e.g. findFlights without an origin), ask ONE short question for it, then call the tool.",
    "6. Before a tool fires, say a 3-5 word bridge line ('on it — checking the weather'). After the tool returns, speak the result naturally in 1-2 sentences.",
    "7. Keep replies short and conversational. No JSON. No prices read to decimals. No repeating the user.",
  ];
  if (country) {
    lines.push("");
    lines.push(`Country context: the user is on the ${country.name} page${country.capital ? ` (capital: ${country.capital})` : ""}.`);
    lines.push(`Default destination is ${country.name}${country.capital ? ` and the default city is ${country.capital}` : ""}. The user does not need to repeat this.`);
    if (country.language && country.greeting) {
      lines.push(`Greet the user with EXACTLY this short phrase first, spoken in ${country.language}: "${country.greeting}"`);
      lines.push(`Then immediately switch to English and ask your first follow-up — typically "where are you flying from?" — unless they already gave you an origin.`);
      lines.push(`If the user replies in ${country.language}, continue the entire conversation in ${country.language}. Otherwise stay in English.`);
    } else {
      lines.push(`Greet the user once with ONE short sentence referencing ${country.name}, then ask your first follow-up question.`);
    }
  } else {
    lines.push("");
    lines.push("No country context yet. Greet the user with one short English sentence and ask where they want to go.");
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
