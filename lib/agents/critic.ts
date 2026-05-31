import { z } from "zod";
import * as weave from "weave";
import { MODELS } from "@/lib/openai";
import { callJSON } from "@/lib/util/json";
import type { CriticResult, Itinerary, TripRequest } from "@/lib/types";

const Schema = z.object({
  approved: z.boolean(),
  issues: z.array(z.string()),
});

const SYSTEM = `You are the Critic agent in a multi-agent travel-planning system.

You receive a draft itinerary and the user's original request. Your job is to verify it and reject anything that doesn't hold up.

Reject (approved=false) if ANY of the following:
- estimatedCostUSD > budgetUSD (the plan exceeds the user's budget).
- estimatedCostUSD is missing or zero when the trip clearly has costs.
- costBreakdown sums to a number meaningfully different from estimatedCostUSD (off by more than ~10%).
- sources array is empty, OR every claim is unsourced.
- days array length disagrees with the stated/requested durationDays.
- The destination doesn't match the user's request.
- Itinerary items are vague placeholders ("see local sights", "explore the city") with no specifics.

If everything checks out, set approved=true and issues=[].
When rejecting, list each problem as a separate concrete, fixable string in issues[]. Be specific — say "Hotel cost $2400 exceeds budget $2000 — drop a night or pick cheaper lodging" rather than "too expensive".

Output JSON only: {"approved": boolean, "issues": ["..."]}`;

export const critic = weave.op(async function critic(draft: Itinerary, request: TripRequest): Promise<CriticResult> {
  const user = [
    "User request:",
    JSON.stringify(request, null, 2),
    "",
    "Draft itinerary to verify:",
    JSON.stringify(draft, null, 2),
  ].join("\n");

  return callJSON({
    model: MODELS.critic,
    system: SYSTEM,
    user,
    schema: Schema,
    temperature: 0.2,
  });
});

export function localChecks(draft: Itinerary, request: TripRequest): string[] {
  const issues: string[] = [];
  if (request.budgetUSD && draft.estimatedCostUSD > request.budgetUSD) {
    issues.push(`Estimated cost $${draft.estimatedCostUSD} exceeds budget $${request.budgetUSD}.`);
  }
  if (request.durationDays && draft.days.length !== request.durationDays) {
    issues.push(`Day count ${draft.days.length} does not match requested duration ${request.durationDays}.`);
  }
  if (!draft.sources || draft.sources.length === 0) {
    issues.push("No sources recorded — every cost must be grounded in a tool result.");
  }
  return issues;
}
