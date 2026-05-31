export type AgentGroup = "orchestration" | "specialist" | "review";

export interface AgentDef {
  name: string;        // internal id used in events
  label: string;
  role: string;        // one-line role description
  source?: string;     // data source label (e.g. "Open-Meteo")
  accent: string;      // tint when active
  iconKey: AgentIconKey;
  group: AgentGroup;
}

export type AgentIconKey =
  | "compass"
  | "scroll"
  | "magnifier"
  | "pen"
  | "lens"
  | "plane"
  | "tower"
  | "cloud"
  | "rail"
  | "bowl"
  | "book"
  | "coin"
  | "film";

export const AGENTS: AgentDef[] = [
  // Orchestration row
  { name: "orchestrator", label: "Orchestrator", role: "Routes your request to the right specialists.", accent: "#7c3aed", iconKey: "compass",   group: "orchestration" },
  { name: "planner",      label: "Planner",      role: "Assembles a coherent day-by-day itinerary.",      accent: "#bd0029", iconKey: "scroll",    group: "orchestration" },
  { name: "placeVision",  label: "Place Vision", role: "Identifies a destination from an uploaded photo.", accent: "#a78bfa", iconKey: "lens",     group: "orchestration" },

  // Specialist row(s)
  { name: "flights",      label: "Flights",      role: "Live flight options.",          source: "Amadeus / mock",       accent: "#0ea5e9", iconKey: "plane",     group: "specialist" },
  { name: "hotels",       label: "Hotels",       role: "Lodging with nightly cost.",    source: "Amadeus / mock",       accent: "#bd0029", iconKey: "tower",     group: "specialist" },
  { name: "weather",      label: "Weather",      role: "7-day forecast.",                source: "Open-Meteo",           accent: "#f59e0b", iconKey: "cloud",     group: "specialist" },
  { name: "transport",    label: "Transport",    role: "Local transit summary.",         source: "Places / preset",      accent: "#1c1b1f", iconKey: "rail",      group: "specialist" },
  { name: "restaurants",  label: "Restaurants",  role: "Curated places to eat.",         source: "Google Places / mock", accent: "#bd0029", iconKey: "bowl",      group: "specialist" },
  { name: "translator",   label: "Translator",   role: "Useful phrases in any language.", source: "OpenAI",              accent: "#db2777", iconKey: "book",      group: "specialist" },
  { name: "currency",     label: "Currency",     role: "Live FX conversion.",            source: "Frankfurter",          accent: "#ca8a04", iconKey: "coin",      group: "specialist" },
  { name: "images",       label: "Images",       role: "Photos of places + landmarks.",  source: "Unsplash / mock",      accent: "#7c3aed", iconKey: "film",      group: "specialist" },

  // Review row
  { name: "critic",       label: "Critic",       role: "Verifies every claim against live data and budget.", accent: "#dc2626", iconKey: "magnifier", group: "review" },
  { name: "writer",       label: "Writer",       role: "Polishes the final itinerary.",                       accent: "#1c1b1f", iconKey: "pen",      group: "review" },
];

export const AGENTS_BY_GROUP = {
  orchestration: AGENTS.filter((a) => a.group === "orchestration"),
  specialist:    AGENTS.filter((a) => a.group === "specialist"),
  review:        AGENTS.filter((a) => a.group === "review"),
};
