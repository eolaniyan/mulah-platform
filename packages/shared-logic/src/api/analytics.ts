import { apiGet } from "./client";

export interface CFASummary {
  period: { from: string; to: string; months: number };
  cashflow: {
    totalIncome: number;
    totalExpenses: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    averageMonthlySurplus: number;
    surplusDeficitStatus: "surplus" | "deficit" | "balanced";
  };
  topCategories: Array<{
    category: string;
    categorySlug: string;
    total: number;
    percentage: number;
    transactionCount: number;
  }>;
  topSubscriptions: Array<{
    name: string;
    monthlyCost: number;
    annualCost: number;
    percentage: number;
  }>;
  riskSignals: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
    value?: number;
  }>;
  patterns: {
    subscriptionCreep: boolean;
    highFixedCosts: boolean;
    irregularIncome: boolean;
    seasonalSpending: boolean;
  };
  recommendations: string[];
}

export interface HealthScore {
  mulahScore: number;
  riskLevel: "Low" | "Medium" | "High";
}

export interface MonthlyAnalytics {
  month: string;
  total: number;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface CashflowData {
  month: string;
  income: number;
  expenses: number;
  surplus: number;
}

export interface SpendingTrend {
  period: string;
  amount: number;
  change: number;
  changePercent: number;
}

export interface UpcomingBill {
  id: number;
  name: string;
  amount: string;
  currency: string;
  dueDate: string;
  category: string;
  daysUntilDue: number;
}

export const analyticsApi = {
  getCFASummary: (params?: { from?: string; to?: string }) =>
    apiGet<CFASummary>(
      `/api/cfa/summary${params?.from ? `?from=${params.from}&to=${params.to}` : ""}`
    ),
  getMonthly: () => apiGet<MonthlyAnalytics[]>("/api/analytics/monthly"),
  getAnnual: () => apiGet<MonthlyAnalytics[]>("/api/analytics/annual"),
  getCategories: () => apiGet<CategoryBreakdown[]>("/api/analytics/categories"),
  getMonthlyDue: () => apiGet<{ total: number; count: number }>("/api/analytics/monthly-due"),
  getUpcoming: () => apiGet<UpcomingBill[]>("/api/analytics/upcoming"),
  getInsights: () => apiGet<{ insights: unknown[] }>("/api/analytics/insights"),
  getSpendingTrends: () => apiGet<SpendingTrend[]>("/api/analytics/spending-trends"),
  getCategoryBreakdown: () => apiGet<CategoryBreakdown[]>("/api/analytics/category-breakdown"),
  getPredictions: () => apiGet<unknown>("/api/analytics/predictions"),
  getCashflow: () => apiGet<CashflowData[]>("/api/analytics/cashflow"),
  getCategoryTotals: () => apiGet<CategoryBreakdown[]>("/api/analytics/category-totals"),
  getBillingSummary: () => apiGet<unknown>("/api/billing/monthly-summary"),
  getMonthlySummary: () => apiGet<unknown>("/api/insights"),
};
