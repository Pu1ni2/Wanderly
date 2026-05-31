export interface FlightsInput {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  travelers?: number;
}

export interface FlightOption {
  airline: string;
  priceUSD: number;
  durationHours: number;
  stops: number;
  note?: string;
}

export interface FlightsResult {
  origin: string;
  destination: string;
  options: FlightOption[];
  source: string;
}

function mock(input: FlightsInput): FlightsResult {
  const travelers = input.travelers ?? 1;
  return {
    origin: input.origin,
    destination: input.destination,
    options: [
      { airline: "Qatar Airways", priceUSD: 780 * travelers, durationHours: 13, stops: 0, note: "Non-stop, full-service" },
      { airline: "Emirates",       priceUSD: 720 * travelers, durationHours: 15, stops: 1, note: "1 stop via DXB" },
      { airline: "Turkish Airlines", priceUSD: 640 * travelers, durationHours: 17, stops: 1, note: "1 stop via IST, best value" },
    ],
    source: "mock://flights",
  };
}

let amadeusToken: { value: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string | null> {
  if (amadeusToken && amadeusToken.expiresAt > Date.now()) return amadeusToken.value;
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const resp = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${id}&client_secret=${secret}`,
    });
    const data = await resp.json();
    if (!data?.access_token) return null;
    amadeusToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return data.access_token;
  } catch {
    return null;
  }
}

export async function flights(input: FlightsInput): Promise<FlightsResult> {
  const token = await getAmadeusToken();
  if (!token || !input.departDate) return mock(input);
  try {
    const params = new URLSearchParams({
      originLocationCode: input.origin,
      destinationLocationCode: input.destination,
      departureDate: input.departDate,
      adults: String(input.travelers ?? 1),
      max: "5",
      currencyCode: "USD",
    });
    if (input.returnDate) params.set("returnDate", input.returnDate);
    const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`;
    const data = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    const offers = data?.data ?? [];
    if (!offers.length) return mock(input);
    return {
      origin: input.origin,
      destination: input.destination,
      options: offers.slice(0, 3).map((o: { validatingAirlineCodes?: string[]; price: { total: string }; itineraries: Array<{ duration: string; segments: unknown[] }> }) => {
        const itin = o.itineraries[0];
        const segments = itin?.segments ?? [];
        const durMatch = itin?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        const hours = durMatch ? Number(durMatch[1] ?? 0) + Number(durMatch[2] ?? 0) / 60 : 0;
        return {
          airline: o.validatingAirlineCodes?.[0] ?? "Unknown",
          priceUSD: Math.round(Number(o.price.total)),
          durationHours: Math.round(hours * 10) / 10,
          stops: Math.max(0, segments.length - 1),
        };
      }),
      source: "amadeus.test",
    };
  } catch {
    return mock(input);
  }
}
