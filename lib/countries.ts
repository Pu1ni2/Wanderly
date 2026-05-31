export interface CountryMeta {
  slug: string;
  name: string;
  nativeName?: string;
  capital?: string;
  lat?: number;
  lng?: number;
  /** Sumi-red is the global default; per-country accents only override when given. */
  accent?: string;
  flag?: string; // emoji
}

const COUNTRY_TABLE: CountryMeta[] = [
  { slug: "japan",         name: "Japan",         nativeName: "日本",      capital: "Tokyo",        lat: 35.6762, lng: 139.6503, accent: "#bd0029", flag: "🇯🇵" },
  { slug: "italy",         name: "Italy",         nativeName: "Italia",    capital: "Rome",         lat: 41.9028, lng:  12.4964, accent: "#0b6e4f", flag: "🇮🇹" },
  { slug: "france",        name: "France",        nativeName: "France",    capital: "Paris",        lat: 48.8566, lng:   2.3522, accent: "#1f4ea1", flag: "🇫🇷" },
  { slug: "spain",         name: "Spain",         nativeName: "España",    capital: "Madrid",       lat: 40.4168, lng:  -3.7038, accent: "#c1272d", flag: "🇪🇸" },
  { slug: "portugal",      name: "Portugal",      nativeName: "Portugal",  capital: "Lisbon",       lat: 38.7223, lng:  -9.1393, accent: "#046a38", flag: "🇵🇹" },
  { slug: "greece",        name: "Greece",        nativeName: "Ελλάδα",    capital: "Athens",       lat: 37.9838, lng:  23.7275, accent: "#1f6ea1", flag: "🇬🇷" },
  { slug: "iceland",       name: "Iceland",       nativeName: "Ísland",    capital: "Reykjavík",    lat: 64.1466, lng: -21.9426, accent: "#2b3e85", flag: "🇮🇸" },
  { slug: "united-kingdom",name: "United Kingdom",nativeName: "UK",        capital: "London",       lat: 51.5074, lng:  -0.1278, accent: "#1f4ea1", flag: "🇬🇧" },
  { slug: "ireland",       name: "Ireland",       nativeName: "Éire",      capital: "Dublin",       lat: 53.3498, lng:  -6.2603, accent: "#0a7c3a", flag: "🇮🇪" },
  { slug: "norway",        name: "Norway",        nativeName: "Norge",     capital: "Oslo",         lat: 59.9139, lng:  10.7522, accent: "#c1272d", flag: "🇳🇴" },
  { slug: "switzerland",   name: "Switzerland",   nativeName: "Suisse",    capital: "Bern",         lat: 46.9480, lng:   7.4474, accent: "#c1272d", flag: "🇨🇭" },
  { slug: "germany",       name: "Germany",       nativeName: "Deutschland",capital:"Berlin",       lat: 52.5200, lng:  13.4050, accent: "#1c1c1c", flag: "🇩🇪" },
  { slug: "netherlands",   name: "Netherlands",   nativeName: "Nederland", capital: "Amsterdam",    lat: 52.3676, lng:   4.9041, accent: "#cf6c00", flag: "🇳🇱" },
  { slug: "morocco",       name: "Morocco",       nativeName: "المغرب",    capital: "Rabat",        lat: 31.6295, lng:  -7.9811, accent: "#c1272d", flag: "🇲🇦" },
  { slug: "egypt",         name: "Egypt",         nativeName: "مصر",       capital: "Cairo",        lat: 30.0444, lng:  31.2357, accent: "#a17a3a", flag: "🇪🇬" },
  { slug: "south-africa",  name: "South Africa",  nativeName: "South Africa", capital: "Cape Town", lat:-33.9249, lng:  18.4241, accent: "#0a7c3a", flag: "🇿🇦" },
  { slug: "india",         name: "India",         nativeName: "भारत",      capital: "New Delhi",    lat: 28.6139, lng:  77.2090, accent: "#cf6c00", flag: "🇮🇳" },
  { slug: "thailand",      name: "Thailand",      nativeName: "ประเทศไทย", capital: "Bangkok",      lat: 13.7563, lng: 100.5018, accent: "#bd0029", flag: "🇹🇭" },
  { slug: "vietnam",       name: "Vietnam",       nativeName: "Việt Nam",  capital: "Hanoi",        lat: 21.0285, lng: 105.8542, accent: "#bd0029", flag: "🇻🇳" },
  { slug: "indonesia",     name: "Indonesia",     nativeName: "Indonesia", capital: "Jakarta",      lat: -6.2088, lng: 106.8456, accent: "#bd0029", flag: "🇮🇩" },
  { slug: "south-korea",   name: "South Korea",   nativeName: "한국",       capital: "Seoul",        lat: 37.5665, lng: 126.9780, accent: "#1f4ea1", flag: "🇰🇷" },
  { slug: "china",         name: "China",         nativeName: "中国",       capital: "Beijing",      lat: 39.9042, lng: 116.4074, accent: "#c1272d", flag: "🇨🇳" },
  { slug: "australia",     name: "Australia",     nativeName: "Australia", capital: "Sydney",       lat:-33.8688, lng: 151.2093, accent: "#1f4ea1", flag: "🇦🇺" },
  { slug: "new-zealand",   name: "New Zealand",   nativeName: "Aotearoa",  capital: "Auckland",     lat:-36.8485, lng: 174.7633, accent: "#1f4ea1", flag: "🇳🇿" },
  { slug: "brazil",        name: "Brazil",        nativeName: "Brasil",    capital: "Rio",          lat:-22.9068, lng: -43.1729, accent: "#0a7c3a", flag: "🇧🇷" },
  { slug: "argentina",     name: "Argentina",     nativeName: "Argentina", capital: "Buenos Aires", lat:-34.6037, lng: -58.3816, accent: "#5fa9d9", flag: "🇦🇷" },
  { slug: "mexico",        name: "Mexico",        nativeName: "México",    capital: "Mexico City",  lat: 19.4326, lng: -99.1332, accent: "#bd0029", flag: "🇲🇽" },
  { slug: "peru",          name: "Peru",          nativeName: "Perú",      capital: "Lima",         lat:-12.0464, lng: -77.0428, accent: "#c1272d", flag: "🇵🇪" },
  { slug: "united-states", name: "United States", nativeName: "USA",       capital: "Washington",   lat: 38.9072, lng: -77.0369, accent: "#1f4ea1", flag: "🇺🇸" },
  { slug: "canada",        name: "Canada",        nativeName: "Canada",    capital: "Toronto",      lat: 43.6532, lng: -79.3832, accent: "#c1272d", flag: "🇨🇦" },
  { slug: "turkey",        name: "Türkiye",       nativeName: "Türkiye",   capital: "Istanbul",     lat: 41.0082, lng:  28.9784, accent: "#c1272d", flag: "🇹🇷" },
  { slug: "uae",           name: "UAE",           nativeName: "الإمارات",  capital: "Dubai",        lat: 25.2048, lng:  55.2708, accent: "#0a7c3a", flag: "🇦🇪" },
  { slug: "kenya",         name: "Kenya",         nativeName: "Kenya",     capital: "Nairobi",      lat: -1.2921, lng:  36.8219, accent: "#0a7c3a", flag: "🇰🇪" },
];

const BY_SLUG: Record<string, CountryMeta> = Object.fromEntries(COUNTRY_TABLE.map((c) => [c.slug, c]));

export const COUNTRIES = COUNTRY_TABLE;

export function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ""))
    .join(" ");
}

/** Look up by slug; never returns null — synthesizes a best-effort meta for unknown slugs. */
export function countryForSlug(slug: string): CountryMeta {
  const key = slug.toLowerCase();
  if (BY_SLUG[key]) return BY_SLUG[key];
  return {
    slug: key,
    name: titleCaseFromSlug(key),
  };
}

/** Slugify any free-text country name (or city). */
export function slugifyCountry(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
