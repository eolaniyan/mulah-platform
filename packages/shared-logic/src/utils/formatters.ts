import type { Currency } from "../constants";

export function formatCurrency(
  amount: number | string,
  currency: Currency | string = "EUR"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "€0.00";

  const symbols: Record<string, string> = { EUR: "€", GBP: "£", USD: "$" };
  const symbol = symbols[currency] ?? currency;

  return `${symbol}${Math.abs(num).toFixed(2)}`;
}

export function formatMonthlyFromBillingCycle(
  cost: number | string,
  billingCycle: string
): number {
  const num = typeof cost === "string" ? parseFloat(cost) : cost;
  if (isNaN(num)) return 0;
  switch (billingCycle) {
    case "yearly":
      return num / 12;
    case "weekly":
      return num * 4.33;
    default:
      return num;
  }
}

export function formatAnnualFromBillingCycle(
  cost: number | string,
  billingCycle: string
): number {
  const monthly = formatMonthlyFromBillingCycle(cost, billingCycle);
  return monthly * 12;
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 || diffDays < -365 ? "numeric" : undefined,
  });
}

export function formatDate(dateStr: string, style: "short" | "long" = "short"): string {
  const date = new Date(dateStr);
  if (style === "long") {
    return date.toLocaleDateString("en-IE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatBillingCycleLabel(cycle: string): string {
  const labels: Record<string, string> = {
    monthly: "/ month",
    yearly: "/ year",
    weekly: "/ week",
    custom: "custom",
  };
  return labels[cycle] ?? `/ ${cycle}`;
}

export function formatSubscriptionName(name: string): string {
  return name.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (!f && !l) return "M";
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}

export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "there"
): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
}
