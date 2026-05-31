export interface RestaurantsInput {
  city: string;
  cuisine?: string;
  count?: number;
}

export interface RestaurantPick {
  name: string;
  cuisine: string;
  priceLevel: 1 | 2 | 3 | 4;
  rating?: number;
  address?: string;
  why?: string;
}

export interface RestaurantsResult {
  city: string;
  picks: RestaurantPick[];
  source: string;
}

function mock(input: RestaurantsInput): RestaurantsResult {
  const cuisine = input.cuisine ?? "local";
  const picks: RestaurantPick[] = [
    { name: `${input.city} Souq Kitchen`, cuisine, priceLevel: 2, rating: 4.6, why: "Lively local favorite, classic regional dishes." },
    { name: `Al Mandi House`, cuisine, priceLevel: 2, rating: 4.5, why: "Slow-cooked meat over fragrant rice, a regional staple." },
    { name: `Corniche Cafe`, cuisine, priceLevel: 1, rating: 4.3, why: "Affordable everyday cooking with a great view." },
    { name: `Spice & Saffron`, cuisine, priceLevel: 3, rating: 4.7, why: "Elevated tasting menu for a special night out." },
  ];
  return { city: input.city, picks: picks.slice(0, input.count ?? 4), source: "mock://restaurants" };
}

export async function restaurants(input: RestaurantsInput): Promise<RestaurantsResult> {
  if (!process.env.GOOGLE_PLACES_API_KEY) return mock(input);
  try {
    const query = `${input.cuisine ?? "best"} restaurants in ${input.city}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const data = await fetch(url).then(r => r.json());
    const results = (data?.results ?? []).slice(0, input.count ?? 4);
    if (!results.length) return mock(input);
    return {
      city: input.city,
      picks: results.map((r: { name: string; price_level?: number; rating?: number; formatted_address?: string }) => ({
        name: r.name,
        cuisine: input.cuisine ?? "local",
        priceLevel: (r.price_level ?? 2) as 1 | 2 | 3 | 4,
        rating: r.rating,
        address: r.formatted_address,
        why: "Highly rated locally.",
      })),
      source: "google-places",
    };
  } catch {
    return mock(input);
  }
}
