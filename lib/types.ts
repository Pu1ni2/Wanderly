export interface TripRequest {
  raw: string;
  destination?: string;
  city?: string;
  origin?: string;
  budgetUSD?: number;
  durationDays?: number;
  travelers?: number;
  startDate?: string;
  endDate?: string;
  preferences?: string[];
}

export type AgentStatus = "started" | "done" | "error" | "info";

export interface AgentEvent {
  agent: string;
  status: AgentStatus;
  detail?: string;
}

export interface ItineraryDay {
  day: number;
  title?: string;
  items: string[];
}

export interface Itinerary {
  summary: string;
  destination: string;
  days: ItineraryDay[];
  estimatedCostUSD: number;
  costBreakdown?: Record<string, number>;
  sources: string[];
  notes?: string[];
}

export interface CriticResult {
  approved: boolean;
  issues: string[];
}

export interface PlanResponse {
  itinerary: Itinerary;
  spokenSummary: string;
  attempts: number;
  verified: boolean;
}

export interface PlaceVisionResult {
  guess: string;
  confidence: number;
  alternates: string[];
}

export type RouteDecision = "plan" | "direct";

export interface OrchestratorParse {
  request: TripRequest;
  route: RouteDecision;
  directAgent?: string;
}
