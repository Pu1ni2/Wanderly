/**
 * Wanderly specialists exposed as an MCP server.
 *
 * Each Wanderly "specialist agent" is registered as an MCP tool. The planner
 * connects to this server as an MCP client (see ./client.ts) and calls these
 * tools through the protocol — same calls that previously went through a
 * hardcoded dispatch table, now flow through a real protocol boundary.
 *
 * Transport is in-memory (InMemoryTransport) so server + client live in the
 * same Next.js process — no separate subprocess to manage, but the MCP
 * protocol (tools/list, tools/call, JSON-RPC framing) is fully exercised.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { weather } from "@/lib/agents/specialists/weather";
import { currency } from "@/lib/agents/specialists/currency";
import { translator } from "@/lib/agents/specialists/translator";
import { images } from "@/lib/agents/specialists/images";
import { restaurants } from "@/lib/agents/specialists/restaurants";
import { transport } from "@/lib/agents/specialists/transport";
import { flights } from "@/lib/agents/specialists/flights";
import { hotels } from "@/lib/agents/specialists/hotels";

function asTextContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }],
  };
}

export function createSpecialistsServer(): McpServer {
  const server = new McpServer({
    name: "wanderly-specialists",
    version: "1.0.0",
  });

  server.registerTool(
    "weather",
    {
      description: "Get a multi-day weather forecast summary for a city.",
      inputSchema: {
        city: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      },
    },
    async ({ city, startDate, endDate }) => asTextContent(await weather({ city, startDate, endDate }))
  );

  server.registerTool(
    "currency",
    {
      description: "Convert an amount from one currency to another (ISO 4217 codes).",
      inputSchema: {
        amount: z.number(),
        from: z.string(),
        to: z.string(),
      },
    },
    async ({ amount, from, to }) => asTextContent(await currency({ amount, from, to }))
  );

  server.registerTool(
    "translator",
    {
      description: "Translate up to 6 short travel phrases into a target language.",
      inputSchema: {
        phrases: z.array(z.string()).max(6),
        targetLanguage: z.string(),
      },
    },
    async ({ phrases, targetLanguage }) => asTextContent(await translator({ phrases, targetLanguage }))
  );

  server.registerTool(
    "images",
    {
      description: "Find illustrative images for a place or landmark.",
      inputSchema: {
        query: z.string(),
        count: z.number().int().min(1).max(5).optional(),
      },
    },
    async ({ query, count }) => asTextContent(await images({ query, count }))
  );

  server.registerTool(
    "restaurants",
    {
      description: "Suggest restaurants in a city, optionally filtered by cuisine.",
      inputSchema: {
        city: z.string(),
        cuisine: z.string().optional(),
        count: z.number().int().min(1).max(6).optional(),
      },
    },
    async ({ city, cuisine, count }) => asTextContent(await restaurants({ city, cuisine, count }))
  );

  server.registerTool(
    "transport",
    {
      description: "Summarize local transit options and typical daily cost for getting around a city.",
      inputSchema: {
        city: z.string(),
      },
    },
    async ({ city }) => asTextContent(await transport({ city }))
  );

  server.registerTool(
    "flights",
    {
      description: "Find flight options between two airports/cities for given dates.",
      inputSchema: {
        origin: z.string(),
        destination: z.string(),
        departDate: z.string().optional(),
        returnDate: z.string().optional(),
        travelers: z.number().int().min(1).optional(),
      },
    },
    async ({ origin, destination, departDate, returnDate, travelers }) =>
      asTextContent(await flights({ origin, destination, departDate, returnDate, travelers }))
  );

  server.registerTool(
    "hotels",
    {
      description: "Find hotel options in a city with optional dates and nightly budget cap.",
      inputSchema: {
        city: z.string(),
        checkinDate: z.string().optional(),
        checkoutDate: z.string().optional(),
        nights: z.number().int().min(1).optional(),
        travelers: z.number().int().min(1).optional(),
        maxNightlyUSD: z.number().optional(),
      },
    },
    async ({ city, checkinDate, checkoutDate, nights, travelers, maxNightlyUSD }) =>
      asTextContent(await hotels({ city, checkinDate, checkoutDate, nights, travelers, maxNightlyUSD }))
  );

  return server;
}
