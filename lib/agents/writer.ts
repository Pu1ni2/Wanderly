import { z } from "zod";
import { MODELS } from "@/lib/openai";
import { callJSON } from "@/lib/util/json";
import type { Itinerary } from "@/lib/types";

const Schema = z.object({
  summary: z.string(),
  spokenSummary: z.string(),
  days: z.array(
    z.object({
      day: z.number(),
      title: z.string(),
      items: z.array(z.string()),
    })
  ),
});

const SYSTEM = `You are the Writer agent in a multi-agent travel-planning system.

You receive a verified itinerary and produce the final user-facing version. Your job is polish, not invention — do not add new costs, destinations, or facts that aren't in the draft.

Tasks:
1) Tighten the "summary" to 1-2 friendly, evocative sentences (no marketing fluff).
2) Give each day a short, vivid title and rewrite the items as crisp bullet points the user can scan ("Morning: ...", "Lunch: ...", "Evening: ..."). Keep the same factual content.
3) Produce a "spokenSummary": a 2-3 sentence natural-sounding paragraph suitable for text-to-speech narration. Conversational, no bullet points, no markdown.

Output JSON only with this shape:
{
  "summary": "...",
  "spokenSummary": "...",
  "days": [{ "day": 1, "title": "...", "items": ["...", "..."] }]
}`;

export interface WriterOutput {
  itinerary: Itinerary;
  spokenSummary: string;
}

export async function writer(approved: Itinerary): Promise<WriterOutput> {
  const polished = await callJSON({
    model: MODELS.writer,
    system: SYSTEM,
    user: `Verified itinerary:\n${JSON.stringify(approved, null, 2)}`,
    schema: Schema,
    temperature: 0.6,
  });

  const itinerary: Itinerary = {
    ...approved,
    summary: polished.summary,
    days: polished.days,
  };

  return { itinerary, spokenSummary: polished.spokenSummary };
}
