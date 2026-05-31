export interface TransportInput {
  city: string;
}

export interface TransportResult {
  city: string;
  summary: string;
  options: Array<{ mode: string; note: string; estDailyUSD: number }>;
  source: string;
}

const PRESETS: Record<string, TransportResult> = {
  doha: {
    city: "Doha",
    summary: "Metro is clean, fast, and very affordable; taxis and Uber/Careem are cheap for short hops.",
    options: [
      { mode: "Metro", note: "3 lines covering most tourist areas", estDailyUSD: 5 },
      { mode: "Taxi / Karwa", note: "Metered, easy to flag", estDailyUSD: 20 },
      { mode: "Uber / Careem", note: "Widely available", estDailyUSD: 25 },
    ],
    source: "preset://transport",
  },
};

export async function transport(input: TransportInput): Promise<TransportResult> {
  const key = input.city.toLowerCase();
  if (PRESETS[key]) return PRESETS[key];
  return {
    city: input.city,
    summary: `Public transit and ride-share are typically available in ${input.city}. Walking is great for the central districts.`,
    options: [
      { mode: "Public transit", note: "Metro / bus where available", estDailyUSD: 8 },
      { mode: "Ride-share", note: "Uber, Bolt, or local equivalent", estDailyUSD: 25 },
      { mode: "Walking", note: "Best for compact downtown areas", estDailyUSD: 0 },
    ],
    source: "mock://transport",
  };
}
