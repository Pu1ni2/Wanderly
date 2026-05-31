import { z } from "zod";
import { MODELS } from "@/lib/openai";
import { callJSON } from "@/lib/util/json";
import { placeVision } from "@/lib/agents/specialists/placevision";
import { planner } from "@/lib/agents/planner";
import { critic, localChecks } from "@/lib/agents/critic";
import { writer } from "@/lib/agents/writer";
import type { AgentEvent, Itinerary, PlaceVisionResult, TripRequest } from "@/lib/types";
import type { ToolName } from "@/lib/tools";

export interface OrchestratorInput {
  query: string;
  budgetUSD?: number;
  imageDataUrl?: string;
  imageUrl?: string;
  confirmedDestination?: string;
}

export type StreamEvent =
  | (AgentEvent & { type: "agent" })
  | { type: "needsConfirmation"; vision: PlaceVisionResult }
  | { type: "tripRequest"; request: TripRequest }
  | { type: "draft"; itinerary: Itinerary; attempt: number }
  | { type: "criticIssues"; issues: string[]; attempt: number }
  | { type: "result"; itinerary: Itinerary; spokenSummary: string; attempts: number; verified: boolean }
  | { type: "error"; message: string };

const PARSE_SYSTEM = `You are the Orchestrator agent.

Parse the user's natural-language request into a structured TripRequest and decide whether to run the full planning pipeline or route to a single specialist.

Route "plan" when the user is asking for an itinerary, trip plan, travel schedule, or anything multi-day.
Route "direct" only for one-off factual lookups like "what's the weather in Doha", "convert 500 USD to QAR", "translate 'thank you' to Arabic".

Available direct agents: weather, currency, translator, restaurants, transport.

Output JSON only:
{
  "request": {
    "raw": "...",
    "destination": "...",        // City, Country if known
    "city": "...",
    "origin": "...",             // optional, IATA or city
    "budgetUSD": 0,              // optional, number only
    "durationDays": 0,           // optional
    "travelers": 0,              // optional
    "preferences": ["..."]       // optional list of interests
  },
  "route": "plan" | "direct",
  "directAgent": "weather"       // only when route is "direct"
}

Do not invent values. Omit fields you cannot determine from the request.`;

const ParseSchema = z.object({
  request: z.object({
    raw: z.string(),
    destination: z.string().optional(),
    city: z.string().optional(),
    origin: z.string().optional(),
    budgetUSD: z.number().optional(),
    durationDays: z.number().optional(),
    travelers: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    preferences: z.array(z.string()).optional(),
  }),
  route: z.enum(["plan", "direct"]),
  directAgent: z.string().optional(),
});

const PLACE_VISION_THRESHOLD = 0.7;

export async function* orchestrate(
  input: OrchestratorInput
): AsyncGenerator<StreamEvent, void, unknown> {
  try {
    let destinationFromImage: string | undefined;

    if ((input.imageDataUrl || input.imageUrl) && !input.confirmedDestination) {
      yield { type: "agent", agent: "placeVision", status: "started", detail: "Identifying place from image" };
      const vision = await placeVision({ imageUrl: input.imageUrl, imageDataUrl: input.imageDataUrl });
      yield { type: "agent", agent: "placeVision", status: "done", detail: `${vision.guess} (${Math.round(vision.confidence * 100)}%)` };
      if (vision.confidence < PLACE_VISION_THRESHOLD) {
        yield { type: "needsConfirmation", vision };
        return;
      }
      destinationFromImage = vision.guess;
    } else if (input.confirmedDestination) {
      destinationFromImage = input.confirmedDestination;
    }

    yield { type: "agent", agent: "orchestrator", status: "started", detail: "Parsing request" };
    const parsed = await callJSON({
      model: MODELS.orchestrator,
      system: PARSE_SYSTEM,
      user: [
        `User query: ${input.query || "(none — relying on uploaded photo)"}`,
        destinationFromImage ? `Destination identified from image: ${destinationFromImage}` : "",
        input.budgetUSD ? `Budget (USD): ${input.budgetUSD}` : "",
      ].filter(Boolean).join("\n"),
      schema: ParseSchema,
      temperature: 0.1,
    });

    const request: TripRequest = {
      ...parsed.request,
      raw: input.query || `Plan a trip to ${destinationFromImage ?? "the destination shown"}`,
      destination: parsed.request.destination ?? destinationFromImage,
      budgetUSD: parsed.request.budgetUSD ?? input.budgetUSD,
    };
    yield { type: "agent", agent: "orchestrator", status: "done", detail: `route=${parsed.route}` };
    yield { type: "tripRequest", request };

    if (parsed.route === "direct" && parsed.directAgent) {
      yield* runDirect(parsed.directAgent, request);
      return;
    }

    yield* runFullPipeline(request);
  } catch (err) {
    yield { type: "error", message: String(err) };
  }
}

async function* runFullPipeline(request: TripRequest): AsyncGenerator<StreamEvent, void, unknown> {
  const MAX_RETRIES = 2;
  let draft: Itinerary | null = null;
  let attempts = 0;
  let issues: string[] = [];

  while (attempts <= MAX_RETRIES) {
    attempts++;
    yield { type: "agent", agent: "planner", status: "started", detail: attempts === 1 ? "Drafting itinerary" : `Revising (attempt ${attempts})` };
    const toolEvents: AgentEvent[] = [];
    draft = await planner(request, issues, (name: ToolName, status, detail) => {
      toolEvents.push({ agent: name, status, detail });
    });
    for (const ev of toolEvents) yield { type: "agent", ...ev };
    yield { type: "agent", agent: "planner", status: "done", detail: `est $${draft.estimatedCostUSD}` };
    yield { type: "draft", itinerary: draft, attempt: attempts };

    yield { type: "agent", agent: "critic", status: "started" };
    const localIssues = localChecks(draft, request);
    const llmCheck = await critic(draft, request);
    const combined = Array.from(new Set([...localIssues, ...llmCheck.issues]));
    const approved = combined.length === 0;
    yield { type: "agent", agent: "critic", status: "done", detail: approved ? "approved" : `${combined.length} issues` };
    if (approved) break;

    yield { type: "criticIssues", issues: combined, attempt: attempts };
    issues = combined;
    if (attempts > MAX_RETRIES) break;
  }

  if (!draft) {
    yield { type: "error", message: "planner produced no draft" };
    return;
  }

  yield { type: "agent", agent: "writer", status: "started" };
  const { itinerary, spokenSummary } = await writer(draft);
  yield { type: "agent", agent: "writer", status: "done" };

  yield {
    type: "result",
    itinerary,
    spokenSummary,
    attempts,
    verified: issues.length === 0 || (attempts <= MAX_RETRIES + 1),
  };
}

async function* runDirect(agentName: string, request: TripRequest): AsyncGenerator<StreamEvent, void, unknown> {
  yield { type: "agent", agent: agentName, status: "started" };
  let info: unknown;
  try {
    const { weather } = await import("@/lib/agents/specialists/weather");
    const { currency } = await import("@/lib/agents/specialists/currency");
    const { translator } = await import("@/lib/agents/specialists/translator");
    const { restaurants } = await import("@/lib/agents/specialists/restaurants");
    const { transport } = await import("@/lib/agents/specialists/transport");
    switch (agentName) {
      case "weather":     info = await weather({ city: request.city || request.destination || "" }); break;
      case "currency":    info = await currency({ amount: 100, from: "USD", to: "EUR" }); break;
      case "translator":  info = await translator({ phrases: ["hello", "thank you", "where is the bathroom?"], targetLanguage: "Arabic" }); break;
      case "restaurants": info = await restaurants({ city: request.city || request.destination || "" }); break;
      case "transport":   info = await transport({ city: request.city || request.destination || "" }); break;
      default: info = { error: `Unknown direct agent: ${agentName}` };
    }
    yield { type: "agent", agent: agentName, status: "done" };
  } catch (err) {
    yield { type: "agent", agent: agentName, status: "error", detail: String(err) };
    info = { error: String(err) };
  }

  const minimal: Itinerary = {
    summary: `Quick answer from the ${agentName} specialist.`,
    destination: request.destination ?? request.city ?? "—",
    days: [{ day: 1, title: "Answer", items: [JSON.stringify(info)] }],
    estimatedCostUSD: 0,
    sources: [agentName],
  };
  yield { type: "result", itinerary: minimal, spokenSummary: "", attempts: 1, verified: true };
}

