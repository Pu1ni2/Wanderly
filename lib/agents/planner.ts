import type OpenAI from "openai";
import * as weave from "weave";
import { llm, MODELS } from "@/lib/openai";
import type { Itinerary, TripRequest } from "@/lib/types";
import { SPECIALIST_TOOLS, dispatchTool, type ToolReporter } from "@/lib/tools";

const PLANNER_SYSTEM = `You are the Planner agent in a multi-agent travel-planning system.

Your job: build a coherent, day-by-day itinerary for the user's trip that fits within their budget.

You have access to specialist tools (weather, currency, translator, images, restaurants, transport, flights, hotels). Call whichever you need, in any order. You may call multiple tools in one turn — they will be executed in parallel.

ABSOLUTE behavior rules (never break):
- NEVER ask the user clarifying questions. The user-facing orchestrator handles that.
- If a parameter is missing, ASSUME a sensible default and proceed. Defaults: origin = "SFO" if not given; start date = "next month"; travelers = 1; cuisine = "local".
- ALWAYS call tools first to gather grounded data — do not respond with text questions or "I need more information".
- After 1-3 rounds of tool calls, return the final JSON itinerary. Never end your turn with a question.

Hard rules:
- Total estimatedCostUSD MUST be less than or equal to the user's budgetUSD.
- Every cost component you cite (flights, hotels, food, transport, activities) must be grounded in tool results. Record the tool/source you used in the "sources" array.
- Be specific: name actual restaurants, hotels, neighborhoods, activities. Do not invent prices for things you didn't look up.
- If you receive critique feedback (issues to fix), revise the plan to address every issue.

When you are done gathering data, return the final itinerary as JSON only, matching this exact shape:

{
  "summary": "1-3 sentence overview of the trip",
  "destination": "City, Country",
  "days": [
    { "day": 1, "title": "Arrival & old town", "items": ["Morning: ...", "Afternoon: ...", "Evening: dinner at ..."] }
  ],
  "estimatedCostUSD": 1850,
  "costBreakdown": { "flights": 700, "hotel": 600, "food": 300, "transport": 100, "activities": 150 },
  "sources": ["flights", "hotels", "weather", "restaurants"],
  "notes": ["optional caveats or tips"]
}

Return the JSON object alone — no prose, no code fences.`;

// gpt-oss-120b on W&B serializes tool calls (one per round); give it room.
const MAX_TOOL_ROUNDS = 12;

export const planner = weave.op(async function planner(
  request: TripRequest,
  feedback?: string[],
  report?: ToolReporter,
  modelOverride?: string,
): Promise<Itinerary> {
  const userMsg = [
    `Plan this trip:`,
    `Raw request: ${request.raw}`,
    request.destination ? `Destination: ${request.destination}` : "",
    request.origin ? `Origin: ${request.origin}` : "",
    request.budgetUSD ? `Budget (USD): ${request.budgetUSD}` : "",
    request.durationDays ? `Duration (days): ${request.durationDays}` : "",
    request.travelers ? `Travelers: ${request.travelers}` : "",
    request.startDate ? `Start date: ${request.startDate}` : "",
    request.endDate ? `End date: ${request.endDate}` : "",
    request.preferences?.length ? `Preferences: ${request.preferences.join(", ")}` : "",
    feedback?.length ? `\nThe critic flagged these issues with your previous draft — fix them all:\n- ${feedback.join("\n- ")}` : "",
  ].filter(Boolean).join("\n");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PLANNER_SYSTEM },
    { role: "user", content: userMsg },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const resp = await llm.chat.completions.create({
      model: modelOverride ?? MODELS.planner,
      messages,
      tools: SPECIALIST_TOOLS,
      temperature: 0.5,
    });
    const msg = resp.choices[0]?.message;
    if (!msg) throw new Error("planner: empty response");
    messages.push(msg);

    const calls = msg.tool_calls;
    if (!calls || calls.length === 0) {
      const raw = msg.content ?? "";
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      try {
        return JSON.parse(cleaned) as Itinerary;
      } catch (err) {
        if (round === MAX_TOOL_ROUNDS - 1) throw new Error(`planner: invalid JSON: ${String(err)}: ${cleaned.slice(0, 300)}`);
        messages.push({ role: "user", content: "Your last message was not valid JSON matching the required shape. Return only the JSON object." });
        continue;
      }
    }

    const results = await Promise.all(
      calls.filter(c => c.type === "function").map(async (c) => {
        const fc = c as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(fc.function.arguments || "{}"); } catch { args = {}; }
        try {
          const data = await dispatchTool(fc.function.name, args, report);
          return { tool_call_id: c.id, content: JSON.stringify(data) };
        } catch (err) {
          return { tool_call_id: c.id, content: JSON.stringify({ error: String(err) }) };
        }
      })
    );

    for (const r of results) {
      messages.push({ role: "tool", tool_call_id: r.tool_call_id, content: r.content });
    }
  }

  throw new Error("planner: exceeded max tool-call rounds without final JSON");
});
