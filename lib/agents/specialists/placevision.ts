import { z } from "zod";
import * as weave from "weave";
import { client, MODELS } from "@/lib/openai";
import type { PlaceVisionResult } from "@/lib/types";

export interface PlaceVisionInput {
  imageUrl?: string;
  imageDataUrl?: string;
}

const Schema = z.object({
  guess: z.string(),
  confidence: z.number().min(0).max(1),
  alternates: z.array(z.string()).max(5),
});

export const placeVision = weave.op(async function placeVision(input: PlaceVisionInput): Promise<PlaceVisionResult> {
  const imageRef = input.imageUrl ?? input.imageDataUrl;
  if (!imageRef) {
    return { guess: "(no image provided)", confidence: 0, alternates: [] };
  }

  const system = [
    "You identify the place, landmark, neighborhood, or city in a photo for a travel-planning app.",
    "Never identify people. Focus only on the location.",
    "Return a single best guess as 'Landmark, City, Country' when possible (e.g. 'Charles River, Boston, USA').",
    "Return confidence as a number between 0 and 1.",
    "Provide up to 3 alternates if you are not fully certain.",
    "If you cannot determine a place at all, return guess='unknown' with confidence 0.",
    'Output JSON only: {"guess": "...", "confidence": 0.0, "alternates": ["...", "..."]}',
  ].join(" ");

  for (let attempt = 0; attempt < 2; attempt++) {
    const resp = await client.chat.completions.create({
      model: MODELS.placeVision,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: "What place is this photo most likely showing?" },
            { type: "image_url", image_url: { url: imageRef } },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    const raw = resp.choices[0]?.message?.content ?? "";
    try {
      return Schema.parse(JSON.parse(raw));
    } catch {
      if (attempt === 1) return { guess: "unknown", confidence: 0, alternates: [] };
    }
  }
  return { guess: "unknown", confidence: 0, alternates: [] };
});
