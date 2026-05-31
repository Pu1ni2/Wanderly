import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  // Returns presence booleans only — never returns key values.
  return Response.json({
    openai:       Boolean(process.env.OPENAI_API_KEY),
    unsplash:     Boolean(process.env.UNSPLASH_ACCESS_KEY),
    googlePlaces: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    amadeus:      Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET),
  });
}
