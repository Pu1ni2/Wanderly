import { z } from "zod";
import { MODELS } from "@/lib/openai";
import { callJSON } from "@/lib/util/json";

export interface TranslatorInput {
  phrases: string[];
  targetLanguage: string;
}

export interface TranslatorResult {
  targetLanguage: string;
  translations: Array<{ original: string; translation: string; pronunciation?: string }>;
  source: string;
}

const Schema = z.object({
  translations: z.array(
    z.object({
      original: z.string(),
      translation: z.string(),
      pronunciation: z.string().optional(),
    })
  ),
});

export async function translator(input: TranslatorInput): Promise<TranslatorResult> {
  const result = await callJSON({
    model: MODELS.specialist,
    system:
      "You translate short travel phrases. For each phrase, return the translation and a simple Latin-alphabet pronunciation hint when the target language uses a non-Latin script. Output JSON: {\"translations\": [{\"original\": \"...\", \"translation\": \"...\", \"pronunciation\": \"...\"}]}",
    user: `Target language: ${input.targetLanguage}\nPhrases:\n${input.phrases.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
    schema: Schema,
    temperature: 0.2,
  });
  return {
    targetLanguage: input.targetLanguage,
    translations: result.translations,
    source: "openai",
  };
}
