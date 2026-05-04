import { apiGet, apiPost } from "./client";

export interface IRISMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

/** Matches services/api IRISBrain IRISResponse */
export interface IRISResponse {
  type: "info" | "navigation" | "guidance" | "error";
  message: string;
  action?: { type: string; target: string };
  steps?: string[];
  suggestions?: string[];
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
  ask: (
    message: string,
    context?: {
      currentPath?: string;
      scrollPosition?: number;
      recentActions?: string[];
    }
  ) =>
    apiPost<IRISResponse>("/api/iris/ask", {
      question: message,
      currentPath: context?.currentPath ?? "/",
      scrollPosition: context?.scrollPosition,
      recentActions: context?.recentActions,
    }),
  getNavigation: () => apiGet<IRISNavigation>("/api/iris/navigation"),
  getPages: () => apiGet<IRISPageContext[]>("/api/iris/pages"),
  analyzeBehavior: (sessionData: Record<string, unknown>) =>
    apiPost<BehaviorAnalysis>("/api/iris/analyze-behavior", { sessionData }),
};
