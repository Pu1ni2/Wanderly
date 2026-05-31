import { NextRequest } from "next/server";
import { client } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return new Response("missing text", { status: 400 });
    }
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text.slice(0, 600),
      response_format: "mp3",
    });
    const buf = Buffer.from(await speech.arrayBuffer());
    return new Response(buf, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new Response(`tts error: ${String(err)}`, { status: 500 });
  }
}
