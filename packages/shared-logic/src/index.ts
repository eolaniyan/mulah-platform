/**
 * @mulah/shared-logic
 *
 * Shared API client, React Query hooks, utilities, and constants
 * used across all Mulah apps (finance-web, finance-mobile, subscription-web).
 *
 * Setup (call once at app startup, before rendering):
 *   import { setApiBaseUrl } from "@mulah/shared-logic";
 *   setApiBaseUrl("https://your-api.example.com");
 *
 * React Native only — also set token provider:
 *   import { setTokenProvider } from "@mulah/shared-logic";
 *   setTokenProvider(() => SecureStore.getItemAsync("auth_token"));
 */

// Client config
export { setApiBaseUrl, setTokenProvider, getApiBaseUrl } from "./api/client";

// API modules
export * from "./api/auth";
export * from "./api/subscriptions";
export * from "./api/analytics";
export * from "./api/iris";
export * from "./api/finance";

// Grouped API objects (for convenience)
export { authApi } from "./api/auth";
export { subscriptionsApi } from "./api/subscriptions";
export { analyticsApi } from "./api/analytics";
export { irisApi } from "./api/iris";
export {
  virtualCardsApi,
  bankApi,
  budgetsApi,
  uswApi,
  meshApi,
  bufferApi,
  paymentsApi,
  categoriesApi,
  supportApi,
  waitlistApi,
  demoApi,
} from "./api/finance";

// Hooks
export { useAuth, useCompleteOnboarding } from "./hooks/useAuth";
export {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useDetectSubscriptions,
  useSubscriptionManagement,
  useSubscriptionFamilyEligibility,
} from "./hooks/useSubscriptions";
export {
  useCFA,
  useHealthScore,
  useAnalyticsSummary,
  useCashflow,
  useCategoryTotals,
  useSpendingTrends,
  useMonthlyAnalytics,
  useAnnualAnalytics,
  useUpcomingBills,
  useAnalyticsInsights,
} from "./hooks/useCFA";
export {
  useIRISNavigation,
  useIRISPages,
  useIRISAsk,
  useIRISBehaviorAnalysis,
  buildIRISContext,
} from "./hooks/useIRIS";
export {
  useVirtualCards,
  useCreateVirtualCard,
  useDeleteVirtualCard,
  useBankConnections,
  useBankTransactions,
  useBudgets,
  useUSWCalculation,
  useUSWTransactions,
  useRunUSW,
  useMeshMerchants,
  useBufferTransactions,
  useBufferExposure,
  useUpcomingPayments,
  useCategories,
} from "./hooks/useFinance";

// Utilities
export {
  formatCurrency,
  formatMonthlyFromBillingCycle,
  formatAnnualFromBillingCycle,
  formatRelativeDate,
  formatDate,
  formatPercentage,
  formatBillingCycleLabel,
  formatSubscriptionName,
  formatInitials,
  formatFullName,
} from "./utils/formatters";
export {
  calculateHealthScore,
  getSavingsRate,
  getRecurringBurdenRatio,
  getCFANarrative,
  getTopRiskSignal,
} from "./utils/cfa";
export {
  getTotalMonthlySpend,
  getTotalAnnualSpend,
  getDaysUntilBilling,
  isOverdue,
  isDueSoon,
  sortByNextBilling,
  groupByCategory,
  getSubscriptionIcon,
  classifyRecurringConfidence,
  getActiveCount,
  getPausedCount,
  getUpcomingThisWeek,
} from "./utils/subscriptions";

// Constants
export * from "./constants";
