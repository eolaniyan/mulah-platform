import { useQuery } from "@tanstack/react-query";
import {
  analyticsApi,
  type CFASummary,
  type CashflowSummary,
  type CategoryBreakdown,
  type SpendingTrend,
  type MonthlyAnalytics,
  type UpcomingBill,
  type AnalyticsSummary,
  type AnalyticsInsightResponse,
} from "../api/analytics";

// ─── CFA Summary (health score + insights + resilience) ───────────────────────

export function useCFA(params?: { from?: string; to?: string }) {
  return useQuery<CFASummary>({
    queryKey: ["/api/cfa/summary", params],
    queryFn: () => analyticsApi.getCFASummary(params),
  });
}

/**
 * Returns the financial health score directly from the API.
 * healthScore is 0-100; riskLevel is 'low' | 'moderate' | 'high' | 'critical'.
 */
export function useHealthScore(params?: { from?: string; to?: string }) {
  const { data: cfaSummary, isLoading, error } = useCFA(params);
  return {
    healthScore: cfaSummary?.healthScore ?? null,
    riskLevel: cfaSummary?.riskLevel ?? null,
    savingsRate: cfaSummary?.savingsRate ?? null,
    subscriptionBurden: cfaSummary?.subscriptionBurden ?? null,
    cfaSummary,
    isLoading,
    error,
  };
}

// ─── Home screen analytics summary ────────────────────────────────────────────

export function useAnalyticsSummary() {
  return useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics"],
    queryFn: () => analyticsApi.getSummary(),
  });
}

// ─── Cashflow (single summary object — NOT an array) ──────────────────────────

export function useCashflow() {
  return useQuery<CashflowSummary>({
    queryKey: ["/api/analytics/cashflow"],
    queryFn: () => analyticsApi.getCashflow(),
  });
}

// ─── Category totals ──────────────────────────────────────────────────────────

export function useCategoryTotals() {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ["/api/analytics/category-totals"],
    queryFn: () => analyticsApi.getCategoryTotals(),
  });
}

// ─── Spending trends ──────────────────────────────────────────────────────────

export function useSpendingTrends() {
  return useQuery<SpendingTrend[]>({
    queryKey: ["/api/analytics/spending-trends"],
    queryFn: () => analyticsApi.getSpendingTrends(),
  });
}

// ─── Monthly analytics ────────────────────────────────────────────────────────

export function useMonthlyAnalytics() {
  return useQuery<MonthlyAnalytics[]>({
    queryKey: ["/api/analytics/monthly"],
    queryFn: () => analyticsApi.getMonthly(),
  });
}

export function useAnnualAnalytics() {
  return useQuery<MonthlyAnalytics[]>({
    queryKey: ["/api/analytics/annual"],
    queryFn: () => analyticsApi.getAnnual(),
  });
}

// ─── Upcoming bills ───────────────────────────────────────────────────────────

export function useUpcomingBills(days = 30) {
  return useQuery<UpcomingBill[]>({
    queryKey: ["/api/analytics/upcoming", days],
    queryFn: () => analyticsApi.getUpcoming(days),
  });
}

// ─── Analytics insights ───────────────────────────────────────────────────────

export function useAnalyticsInsights() {
  return useQuery<AnalyticsInsightResponse>({
    queryKey: ["/api/analytics/insights"],
    queryFn: () => analyticsApi.getInsights(),
  });
}
