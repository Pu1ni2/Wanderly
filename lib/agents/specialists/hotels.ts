export interface HotelsInput {
  city: string;
  checkinDate?: string;
  checkoutDate?: string;
  nights?: number;
  travelers?: number;
  maxNightlyUSD?: number;
}

export interface HotelOption {
  name: string;
  nightlyUSD: number;
  totalUSD: number;
  rating?: number;
  neighborhood?: string;
  note?: string;
}

export interface HotelsResult {
  city: string;
  options: HotelOption[];
  source: string;
}

function mock(input: HotelsInput): HotelsResult {
  const nights = input.nights ?? 3;
  const cap = input.maxNightlyUSD ?? 999;
  const all: HotelOption[] = [
    { name: `${input.city} Boutique Inn`,     nightlyUSD: 110, totalUSD: 110 * nights, rating: 4.4, neighborhood: "Old Town", note: "Walkable, charming" },
    { name: `Downtown Suites ${input.city}`,  nightlyUSD: 165, totalUSD: 165 * nights, rating: 4.6, neighborhood: "Central",  note: "Modern, central" },
    { name: `${input.city} Harbor Hotel`,     nightlyUSD: 230, totalUSD: 230 * nights, rating: 4.7, neighborhood: "Waterfront", note: "Best views, splurge" },
  ];
  return { city: input.city, options: all.filter(o => o.nightlyUSD <= cap), source: "mock://hotels" };
}

export async function hotels(input: HotelsInput): Promise<HotelsResult> {
  return mock(input);
}
