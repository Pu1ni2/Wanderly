/**
 * Weave evaluation: compare the planner running on two W&B Inference models.
 *
 * Run:   npm run eval:planner
 *
 * Requires WANDB_API_KEY in .env.local. The npm script wraps this in
 * `dotenv -e .env.local -- tsx` because tsx does not auto-load .env.local.
 */
import * as weave from "weave";
import { ensureWeave } from "../lib/weave";
import { planner } from "../lib/agents/planner";
import type { Itinerary, TripRequest } from "../lib/types";

interface Row extends TripRequest {
  budgetUSD: number;
  durationDays: number;
  travelers: number;
}

const ROWS: Row[] = [
  { raw: "4 days in Doha for 2, food + events",       destination: "Doha",   budgetUSD: 2500, durationDays: 4, travelers: 2 },
  { raw: "weekend in Lisbon for 1",                    destination: "Lisbon", budgetUSD:  900, durationDays: 3, travelers: 1 },
  { raw: "5 days Tokyo for 2, mid-range",              destination: "Tokyo",  budgetUSD: 4000, durationDays: 5, travelers: 2 },
  { raw: "3 days Cairo for 2 on a tight budget",       destination: "Cairo",  budgetUSD:  700, durationDays: 3, travelers: 2 },
];

// Scorers as weave.op so they show up in the trace tree.
const withinBudget = weave.op(
  function withinBudget({ modelOutput, datasetRow }: { modelOutput: Itinerary; datasetRow: Row }) {
    const ok = typeof modelOutput?.estimatedCostUSD === "number" && modelOutput.estimatedCostUSD <= datasetRow.budgetUSD;
    return { withinBudget: ok };
  },
  { name: "withinBudget" }
);

const hasSources = weave.op(
  function hasSources({ modelOutput }: { modelOutput: Itinerary }) {
    const ok = Array.isArray(modelOutput?.sources) && modelOutput.sources.length > 0;
    return { hasSources: ok };
  },
  { name: "hasSources" }
);

const MODELS_TO_COMPARE = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
] as const;

async function run() {
  await ensureWeave();

  const dataset = new weave.Dataset<Row>({
    name: "planner-trips",
    rows: ROWS,
  });

  const evaluation = new weave.Evaluation({
    name: "planner-model-comparison",
    dataset,
    scorers: [withinBudget, hasSources],
  });

  for (const model of MODELS_TO_COMPARE) {
    // The "model" the evaluation runs is just a function that maps a row to a planner result.
    const modelFn = weave.op(
      async function plannerModel({ datasetRow }: { datasetRow: Row }): Promise<Itinerary> {
        return await planner(datasetRow, undefined, undefined, model);
      },
      { name: `planner-${model.replace(/[/]/g, "_")}` }
    );

    console.log(`\n--- Evaluating ${model} ---`);
    const summary = await evaluation.evaluate({ model: modelFn });
    console.log(`Summary for ${model}:`, JSON.stringify(summary, null, 2));
  }

  console.log("\n✓ Evaluation complete. Open the comparison page on wandb.ai.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
