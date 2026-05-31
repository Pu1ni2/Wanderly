import OpenAI from "openai";

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const MODELS = {
  orchestrator: "gpt-4o-mini",
  specialist:   "gpt-4o-mini",
  placeVision:  "gpt-4o",
  planner:      "gpt-4o",
  critic:       "gpt-4o",
  writer:       "gpt-4o",
} as const;
