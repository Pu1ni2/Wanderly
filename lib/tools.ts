import type OpenAI from "openai";
import * as weave from "weave";
import { weather } from "@/lib/agents/specialists/weather";
import { currency } from "@/lib/agents/specialists/currency";
import { translator } from "@/lib/agents/specialists/translator";
import { images } from "@/lib/agents/specialists/images";
import { restaurants } from "@/lib/agents/specialists/restaurants";
import { transport } from "@/lib/agents/specialists/transport";
import { flights } from "@/lib/agents/specialists/flights";
import { hotels } from "@/lib/agents/specialists/hotels";

export type ToolName =
  | "weather"
  | "currency"
  | "translator"
  | "images"
  | "restaurants"
  | "transport"
  | "flights"
  | "hotels";

export const SPECIALIST_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "weather",
      description: "Get a multi-day weather forecast summary for a city. Use when the user asks about weather or you need to recommend day-by-day activities.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          startDate: { type: "string", description: "YYYY-MM-DD, optional" },
          endDate: { type: "string", description: "YYYY-MM-DD, optional" },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "currency",
      description: "Convert an amount from one currency to another. Useful to express the budget in the local currency.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          from: { type: "string", description: "ISO 4217 code, e.g. USD" },
          to: { type: "string", description: "ISO 4217 code, e.g. QAR" },
        },
        required: ["amount", "from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "translator",
      description: "Translate a small list of short travel phrases into a target language.",
      parameters: {
        type: "object",
        properties: {
          phrases: { type: "array", items: { type: "string" }, maxItems: 6 },
          targetLanguage: { type: "string" },
        },
        required: ["phrases", "targetLanguage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "images",
      description: "Find a few illustrative images for a place or landmark.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          count: { type: "integer", minimum: 1, maximum: 5 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "restaurants",
      description: "Suggest restaurants in a city, optionally filtered by cuisine.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          cuisine: { type: "string" },
          count: { type: "integer", minimum: 1, maximum: 6 },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transport",
      description: "Summarize local transit options and typical daily cost for getting around a city.",
      parameters: {
        type: "object",
        properties: { city: { type: "string" } },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flights",
      description: "Find flight options between two airports for given dates and traveler count. Origin/destination should be IATA codes when known; otherwise city names.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string" },
          destination: { type: "string" },
          departDate: { type: "string", description: "YYYY-MM-DD" },
          returnDate: { type: "string", description: "YYYY-MM-DD, optional" },
          travelers: { type: "integer", minimum: 1 },
        },
        required: ["origin", "destination"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hotels",
      description: "Find hotel options in a city for given dates, travelers, and an optional nightly budget cap.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          checkinDate: { type: "string" },
          checkoutDate: { type: "string" },
          nights: { type: "integer", minimum: 1 },
          travelers: { type: "integer", minimum: 1 },
          maxNightlyUSD: { type: "number" },
        },
        required: ["city"],
      },
    },
  },
];

export type ToolReporter = (name: ToolName, status: "started" | "done" | "error", detail?: string) => void;

export const dispatchTool = weave.op(async function dispatchTool(name: string, args: Record<string, unknown>, report?: ToolReporter): Promise<unknown> {
  const tn = name as ToolName;
  report?.(tn, "started", JSON.stringify(args).slice(0, 120));
  try {
    let result: unknown;
    const a = args as unknown;
    switch (tn) {
      case "weather":     result = await weather(a as Parameters<typeof weather>[0]); break;
      case "currency":    result = await currency(a as Parameters<typeof currency>[0]); break;
      case "translator":  result = await translator(a as Parameters<typeof translator>[0]); break;
      case "images":      result = await images(a as Parameters<typeof images>[0]); break;
      case "restaurants": result = await restaurants(a as Parameters<typeof restaurants>[0]); break;
      case "transport":   result = await transport(a as Parameters<typeof transport>[0]); break;
      case "flights":     result = await flights(a as Parameters<typeof flights>[0]); break;
      case "hotels":      result = await hotels(a as Parameters<typeof hotels>[0]); break;
      default: throw new Error(`Unknown tool: ${name}`);
    }
    report?.(tn, "done");
    return result;
  } catch (err) {
    report?.(tn, "error", String(err));
    throw err;
  }
});
