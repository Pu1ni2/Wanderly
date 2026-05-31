import OpenAI from "openai";

let _client: OpenAI | null = null;

export const client = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    if (!_client) {
      _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "missing-key-set-OPENAI_API_KEY" });
    }
    return Reflect.get(_client, prop, receiver);
  },
});

export const MODELS = {
  orchestrator: "gpt-4o-mini",
  specialist:   "gpt-4o-mini",
  placeVision:  "gpt-4o",
  planner:      "gpt-4o",
  critic:       "gpt-4o",
  writer:       "gpt-4o",
} as const;
