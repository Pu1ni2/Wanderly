/**
 * MCP client for the Wanderly specialists server.
 *
 * Lazily spins up a linked client+server pair on InMemoryTransport so the
 * planner can call specialists over MCP. The pair is created once per process
 * and cached.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createSpecialistsServer } from "./specialists-server";

let clientPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const server = createSpecialistsServer();
      await server.connect(serverTransport);

      const client = new Client({ name: "wanderly-planner", version: "1.0.0" });
      await client.connect(clientTransport);
      return client;
    })();
  }
  return clientPromise;
}

/**
 * Tool definition shape compatible with OpenAI Chat Completions `tools` arg.
 * We translate MCP tool defs → OpenAI tool defs so the planner LLM can use them.
 */
export interface OpenAIToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

let toolsCache: OpenAIToolDef[] | null = null;

/** Discover specialists via MCP and return them as OpenAI tool definitions. */
export async function mcpListTools(): Promise<OpenAIToolDef[]> {
  if (toolsCache) return toolsCache;
  const client = await getClient();
  const { tools } = await client.listTools();
  toolsCache = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? `Specialist tool: ${t.name}`,
      parameters: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
    },
  }));
  return toolsCache;
}

/** Call a specialist tool through MCP. Returns the parsed JSON result. */
export async function mcpCallTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const client = await getClient();
  const result = await client.callTool({ name, arguments: args });
  // The server returns content as text JSON; parse the first text content block.
  const content = (result.content as Array<{ type: string; text?: string }> | undefined) ?? [];
  const text = content.find((c) => c.type === "text")?.text ?? "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
