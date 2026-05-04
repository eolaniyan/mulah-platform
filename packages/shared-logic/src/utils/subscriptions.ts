import type { Subscription } from "../api/subscriptions";
import { KNOWN_SUBSCRIPTIONS, RECURRING_CONFIDENCE_THRESHOLD } from "../constants";
import { formatMonthlyFromBillingCycle } from "./formatters";

export function getTotalMonthlySpend(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.isActive && s.status !== "cancelled")
    .reduce((sum, s) => {
      return sum + formatMonthlyFromBillingCycle(s.cost, s.billingCycle);
    }, 0);
}

export function getTotalAnnualSpend(subscriptions: Subscription[]): number {
  return getTotalMonthlySpend(subscriptions) * 12;
}

export function getDaysUntilBilling(nextBillingDate: string): number {
  const now = new Date();
  const billing = new Date(nextBillingDate);
  return Math.ceil((billing.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(nextBillingDate: string): boolean {
  return getDaysUntilBilling(nextBillingDate) < 0;
}

export function isDueSoon(nextBillingDate: string, withinDays = 7): boolean {
  const days = getDaysUntilBilling(nextBillingDate);
  return days >= 0 && days <= withinDays;
}

export function sortByNextBilling(subscriptions: Subscription[]): Subscription[] {
  return [...subscriptions].sort(
    (a, b) =>
      new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()
  );
}

export function groupByCategory(
  subscriptions: Subscription[]
): Record<string, Subscription[]> {
  return subscriptions.reduce(
    (acc, sub) => {
      const cat = sub.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(sub);
      return acc;
    },
    {} as Record<string, Subscription[]>
  );
}

export function getSubscriptionIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(KNOWN_SUBSCRIPTIONS)) {
    if (lower.includes(key)) return key;
  }
  return "default";
}

export function classifyRecurringConfidence(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 0.85) return { label: "High confidence", color: "#10b981" };
  if (confidence >= RECURRING_CONFIDENCE_THRESHOLD)
    return { label: "Likely recurring", color: "#f59e0b" };
  return { label: "Possible", color: "#6b7280" };
}

export function getActiveCount(subscriptions: Subscription[]): number {
  return subscriptions.filter((s) => s.isActive && s.status === "active").length;
}

export function getPausedCount(subscriptions: Subscription[]): number {
  return subscriptions.filter((s) => s.status === "paused").length;
}

export function getUpcomingThisWeek(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter((s) => isDueSoon(s.nextBillingDate, 7));
}
