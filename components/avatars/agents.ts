export type MascotShape =
  | "lantern"
  | "scroll"
  | "magnifier"
  | "pen"
  | "camera"
  | "airplane"
  | "pagoda"
  | "cloud"
  | "train"
  | "bowl"
  | "book"
  | "coin"
  | "film";

export interface AgentAvatar {
  name: string;
  label: string;
  shape: MascotShape;
  color: string;       // base material color
  glow: string;        // emissive color when running
  group: "orchestration" | "specialist" | "review";
}

export const AGENT_AVATARS: AgentAvatar[] = [
  { name: "orchestrator", label: "Orchestrator", shape: "lantern",   color: "#ffd166", glow: "#ffb703", group: "orchestration" },
  { name: "placeVision",  label: "Place Vision", shape: "camera",    color: "#7d6cff", glow: "#a78bfa", group: "orchestration" },
  { name: "planner",      label: "Planner",      shape: "scroll",    color: "#f4ead6", glow: "#bd0029", group: "orchestration" },

  { name: "flights",      label: "Flights",      shape: "airplane",  color: "#ffffff", glow: "#0ea5e9", group: "specialist" },
  { name: "hotels",       label: "Hotels",       shape: "pagoda",    color: "#bd0029", glow: "#f7d6e0", group: "specialist" },
  { name: "weather",      label: "Weather",      shape: "cloud",     color: "#ffffff", glow: "#fbbf24", group: "specialist" },
  { name: "transport",    label: "Transport",    shape: "train",     color: "#1c1b1f", glow: "#bd0029", group: "specialist" },
  { name: "restaurants",  label: "Restaurants",  shape: "bowl",      color: "#f5e6d3", glow: "#bd0029", group: "specialist" },
  { name: "translator",   label: "Translator",   shape: "book",      color: "#f7d6e0", glow: "#bd0029", group: "specialist" },
  { name: "currency",     label: "Currency",     shape: "coin",      color: "#e3b341", glow: "#fbbf24", group: "specialist" },
  { name: "images",       label: "Images",       shape: "film",      color: "#1c1b1f", glow: "#a78bfa", group: "specialist" },

  { name: "critic",       label: "Critic",       shape: "magnifier", color: "#bd0029", glow: "#fbbf24", group: "review" },
  { name: "writer",       label: "Writer",       shape: "pen",       color: "#1c1b1f", glow: "#bd0029", group: "review" },
];
