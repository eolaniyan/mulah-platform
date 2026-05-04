import { apiGet } from "./client";

// ─── /api/cfa/summary ─────────────────────────────────────────────────────────
// What the API actually returns — used by CFA Insights screen + health score

export interface CFAInsight {
  type: string;
  severity: "info" | "warning" | "success" | "error";
  title: string;
  description: string;
  action?: string;
  details?: {
    headline: string;
    whyItMatters: string;
    services?: Array<{ name: string; monthlyCost: number }>;
    eligibleSubscriptions?: Array<{
      name: string;
      currentMonthly: number;
      annualEquivalent: number;
      yearlySavings: number;
    }>;
    comparison?: { yours: number; recommended: number; difference: number };
    potentialSavings?: { monthly?: number; yearly: number; tangible: string };
    recommendation: string;
    steps?: string[];
  };
}

export interface CFAPattern {
  name: string;
  description: string;
  trend: "up" | "down" | "stable";
}

export interface CFAResilience {
  emergencyFundMonths: number;
  incomeStability: number;
  expenseFlexibility: number;
}

/** Shape returned by GET /api/cfa/summary */
export interface CFASummary {
  healthScore: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  riskScore?: number;
  savingsRate: number;
  subscriptionBurden: number;
  monthlyNetIncome: number;
  insights: CFAInsight[];
  patterns: CFAPattern[];
  resilience: CFAResilience;
}

// ─── /api/analytics (Home screen summary) ─────────────────────────────────────
export interface AnalyticsSummary {
  monthlyTotal: number;
  annualTotal: number;
  categoryBreakdown: Array<{ category: string; total: number; count: number }>;
  upcomingRenewals: Array<{
    id: number;
    name: string;
    cost: string;
    billingCycle: string;
    nextBillingDate: string;
    category: string;
    iconColor?: string | null;
    isActive: boolean;
    status: string;
  }>;
}

// ─── /api/analytics/cashflow ──────────────────────────────────────────────────
/** Shape returned by GET /api/analytics/cashflow — single object, not array */
export interface CashflowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  subscriptionExpenses: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  transactionCount: number;
  isSubscriptionBased: boolean;
}

// ─── /api/analytics/monthly ───────────────────────────────────────────────────
export interface MonthlyAnalytics {
  month: string;
  total: number;
  count: number;
}

// ─── /api/analytics/categories & /api/analytics/category-totals ───────────────
export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

// ─── /api/analytics/spending-trends ───────────────────────────────────────────
export interface SpendingTrend {
  period: string;
  amount: number;
  change: number;
  changePercent: number;
}

// ─── /api/analytics/upcoming ─────────────────────────────────────────────────
// Returns Subscription[] from storage — use these fields:
export interface UpcomingBill {
  id: number;
  name: string;
  cost: string;
  currency?: string;
  billingCycle: string;
  nextBillingDate: string;
  category: string;
  iconColor?: string | null;
  isActive: boolean;
  status: string;
}

// ─── /api/analytics/insights ─────────────────────────────────────────────────
export interface AnalyticsInsightResponse {
  insights: CFAInsight[];
}

// ─── API object ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  /** GET /api/analytics — Home screen hub summary */
  getSummary: () => apiGet<AnalyticsSummary>("/api/analytics"),

  /** GET /api/cfa/summary — Full CFA analysis (health score, insights, resilience) */
  getCFASummary: (params?: { from?: string; to?: string }) =>
    apiGet<CFASummary>(
      `/api/cfa/summary${params?.from ? `?from=${params.from}&to=${params.to}` : ""}`
    ),

  /** GET /api/analytics/cashflow — Single cashflow summary object */
  getCashflow: () => apiGet<CashflowSummary>("/api/analytics/cashflow"),

  /** GET /api/analytics/monthly — Monthly spend totals array */
  getMonthly: () => apiGet<MonthlyAnalytics[]>("/api/analytics/monthly"),

  /** GET /api/analytics/annual — Annual spend totals array */
  getAnnual: () => apiGet<MonthlyAnalytics[]>("/api/analytics/annual"),

  /** GET /api/analytics/categories — Category spend breakdown */
  getCategories: () => apiGet<CategoryBreakdown[]>("/api/analytics/categories"),

  /** GET /api/analytics/monthly-due — What's due this month */
  getMonthlyDue: () =>
    apiGet<{ total: number; count: number }>("/api/analytics/monthly-due"),

  /** GET /api/analytics/upcoming?days=N — Upcoming subscription renewals (default 7 days) */
  getUpcoming: (days = 30) =>
    apiGet<UpcomingBill[]>(`/api/analytics/upcoming?days=${days}`),

  /** GET /api/analytics/insights — Smart insights derived from spend */
  getInsights: () => apiGet<AnalyticsInsightResponse>("/api/analytics/insights"),

  /** GET /api/analytics/spending-trends — Spending trends over time */
  getSpendingTrends: () =>
    apiGet<SpendingTrend[]>("/api/analytics/spending-trends"),

  /** GET /api/analytics/category-breakdown */
  getCategoryBreakdown: () =>
    apiGet<CategoryBreakdown[]>("/api/analytics/category-breakdown"),

  /** GET /api/analytics/predictions */
  getPredictions: () => apiGet<unknown>("/api/analytics/predictions"),

  /** GET /api/analytics/category-totals */
  getCategoryTotals: () =>
    apiGet<CategoryBreakdown[]>("/api/analytics/category-totals"),

  /** GET /api/billing/monthly-summary */
  getBillingSummary: () => apiGet<unknown>("/api/billing/monthly-summary"),

  /** GET /api/insights — Subscription-level insights */
  getMonthlySummary: () => apiGet<unknown>("/api/insights"),
};
