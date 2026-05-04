import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type CFASummary } from "../api/analytics";
import { calculateHealthScore } from "../utils/cfa";

export function useCFA(params?: { from?: string; to?: string }) {
  return useQuery<CFASummary>({
    queryKey: ["/api/cfa/summary", params],
    queryFn: () => analyticsApi.getCFASummary(params),
  });
}

export function useHealthScore(params?: { from?: string; to?: string }) {
  const { data: cfa, isLoading, error } = useCFA(params);
  const healthScore = cfa ? calculateHealthScore(cfa) : null;
  return { healthScore, cfaSummary: cfa, isLoading, error };
}

export function useCashflow() {
  return useQuery({
    queryKey: ["/api/analytics/cashflow"],
    queryFn: () => analyticsApi.getCashflow(),
  });
}

export function useCategoryTotals() {
  return useQuery({
    queryKey: ["/api/analytics/category-totals"],
    queryFn: () => analyticsApi.getCategoryTotals(),
  });
}

export function useSpendingTrends() {
  return useQuery({
    queryKey: ["/api/analytics/spending-trends"],
    queryFn: () => analyticsApi.getSpendingTrends(),
  });
}

export function useMonthlyAnalytics() {
  return useQuery({
    queryKey: ["/api/analytics/monthly"],
    queryFn: () => analyticsApi.getMonthly(),
  });
}

export function useAnnualAnalytics() {
  return useQuery({
    queryKey: ["/api/analytics/annual"],
    queryFn: () => analyticsApi.getAnnual(),
  });
}

export function useUpcomingBills() {
  return useQuery({
    queryKey: ["/api/analytics/upcoming"],
    queryFn: () => analyticsApi.getUpcoming(),
  });
}

export function useAnalyticsInsights() {
  return useQuery({
    queryKey: ["/api/analytics/insights"],
    queryFn: () => analyticsApi.getInsights(),
  });
}
