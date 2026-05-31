import OpenAI from "openai";
// Note: `wrapOpenAI` from weave conflicts with openai SDK v6 under parallel
// calls (Body already read). We trace at the agent-function level via
// `weave.op` wrappers instead — the trace tree is built from those.

/**
 * `client` — the OpenAI SDK pointed at OpenAI itself.
 * Used for: TTS (/api/speak), Realtime ephemeral-key mint (/api/voice/session),
 * and Place Vision (vision-capable gpt-4o).
 */
let _client: OpenAI | null = null;
export const client = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    if (!_client) {
      _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "missing-key-set-OPENAI_API_KEY" });
    }
    return Reflect.get(_client, prop, receiver);
  },
});

/**
 * `llm` — the OpenAI SDK pointed at W&B Inference, wrapped by Weave so every
 * chat.completions.create call is automatically traced.
 *
 * Used for: every planning agent (orchestrator parse, planner, critic, writer,
 * translator). Same OpenAI SDK shape — W&B Inference is OpenAI-compatible.
 */
let _llm: OpenAI | null = null;
export const llm = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    if (!_llm) {
      _llm = new OpenAI({
        baseURL: "https://api.inference.wandb.ai/v1",
        apiKey: process.env.WANDB_API_KEY ?? "missing-key-set-WANDB_API_KEY",
        defaultHeaders: process.env.WANDB_PROJECT
          ? { "OpenAI-Project": process.env.WANDB_PROJECT }
          : undefined,
      });
    }
    return Reflect.get(_llm as object, prop, receiver);
  },
});

/**
 * Model registry — planning agents run on W&B Inference's gpt-oss family;
 * vision stays on OpenAI gpt-4o for this pass (Gemma 4 31B migration is P1).
 */
export const MODELS = {
  // W&B Inference (via `llm`)
  orchestrator: "openai/gpt-oss-20b",
  specialist:   "openai/gpt-oss-20b",
  planner:      "openai/gpt-oss-120b",
  critic:       "openai/gpt-oss-120b",
  writer:       "openai/gpt-oss-120b",

  // OpenAI (via `client`) — vision-capable
  placeVision:  "gpt-4o",
} as const;
