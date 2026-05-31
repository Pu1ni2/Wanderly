import type OpenAI from "openai";
import * as weave from "weave";
import { mcpCallTool } from "@/mcp/client";

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

/**
 * Specialist tool dispatch — routes every call through the MCP client.
 * The MCP boundary (server + client over InMemoryTransport) means tools/list
 * and tools/call go through real JSON-RPC framing, not a hardcoded switch.
 */
const VALID_TOOLS: Set<string> = new Set([
  "weather", "currency", "translator", "images",
  "restaurants", "transport", "flights", "hotels",
]);

/**
 * Sanitize tool names from gpt-oss models that occasionally leak their
 * internal channel/role tokens (e.g. "transport<|channel|>commentary",
 * "flights.commentary"). Strips everything after the first non-alphanum char
 * and lowercases.
 */
function sanitizeToolName(raw: string): string {
  const cleaned = raw.toLowerCase().split(/[^a-z0-9_]/)[0];
  return cleaned;
}

export const dispatchTool = weave.op(async function dispatchTool(name: string, args: Record<string, unknown>, report?: ToolReporter): Promise<unknown> {
  const clean = sanitizeToolName(name);
  const tn = clean as ToolName;

  if (!VALID_TOOLS.has(clean)) {
    const detail = `unknown tool "${name}" (cleaned: "${clean}")`;
    report?.(tn, "error", detail);
    // Return a structured error so the planner can recover instead of throwing.
    return { error: detail, validTools: Array.from(VALID_TOOLS) };
  }

  report?.(tn, "started", JSON.stringify(args).slice(0, 120));
  try {
    const result = await mcpCallTool(clean, args);
    report?.(tn, "done");
    return result;
  } catch (err) {
    report?.(tn, "error", String(err));
    return { error: String(err) };
  }
});
