import type { z } from "zod";
import { client } from "@/lib/openai";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

interface Opts<T> {
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  temperature?: number;
}

export async function callJSON<T>({ model, system, user, schema, temperature = 0.4 }: Opts<T>): Promise<T> {
  const messages: ChatMsg[] = [
    { role: "system", content: system + "\n\nRespond with valid JSON only. No markdown, no prose, no code fences." },
    { role: "user", content: user },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const resp = await client.chat.completions.create({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    });
    const raw = resp.choices[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(raw);
      return schema.parse(parsed);
    } catch (err) {
      if (attempt === 1) throw new Error(`callJSON failed after retry: ${String(err)}. Raw: ${raw.slice(0, 500)}`);
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: "Your previous response was not valid JSON matching the required schema. Return valid JSON only." });
    }
  }
  throw new Error("unreachable");
}
