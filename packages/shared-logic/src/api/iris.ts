import { apiGet, apiPost } from "./client";

export interface IRISMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface IRISResponse {
  reply: string;
  context?: Record<string, unknown>;
  actions?: Array<{ label: string; route: string }>;
  confidence?: number;
}

export interface IRISNavigation {
  suggestedRoutes: Array<{
    label: string;
    route: string;
    reason: string;
  }>;
}

export interface IRISPageContext {
  page: string;
  summary: string;
  availableActions: string[];
}

export interface BehaviorAnalysis {
  patterns: string[];
  recommendations: string[];
  riskFlags: string[];
}

export const irisApi = {
  ask: (message: string, context?: Record<string, unknown>) =>
    apiPost<IRISResponse>("/api/iris/ask", { message, context }),
  getNavigation: () => apiGet<IRISNavigation>("/api/iris/navigation"),
  getPages: () => apiGet<IRISPageContext[]>("/api/iris/pages"),
  analyzeBehavior: (sessionData: Record<string, unknown>) =>
    apiPost<BehaviorAnalysis>("/api/iris/analyze-behavior", { sessionData }),
};
