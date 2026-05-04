export const MULAH_CATEGORIES = [
  "Subscriptions",
  "Groceries",
  "Transport",
  "Fuel",
  "Lifestyle",
  "Bills",
  "Income",
  "General",
  "Entertainment",
  "Health & Fitness",
  "Education",
  "Shopping",
  "Dining",
  "Travel",
] as const;

export type MulahCategory = (typeof MULAH_CATEGORIES)[number];

export const RECURRING_TYPES = [
  "subscription",
  "bill",
  "usage_based_recurring",
  "recurring_income",
  "unknown_recurring",
] as const;

export type RecurringType = (typeof RECURRING_TYPES)[number];

export const BILLING_CYCLES = ["weekly", "monthly", "yearly", "custom"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUSES = ["active", "paused", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const CURRENCIES = ["EUR", "GBP", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "EUR";

export const HEALTH_SCORE_THRESHOLDS = {
  LOW_RISK: 80,
  MEDIUM_RISK: 60,
} as const;

export const RECURRING_CONFIDENCE_THRESHOLD = 0.5;
export const MIN_RECURRING_OCCURRENCES = 2;

export const KNOWN_SUBSCRIPTIONS: Record<string, string> = {
  netflix: "streaming",
  spotify: "music",
  "youtube premium": "streaming",
  youtube: "streaming",
  apple: "cloud",
  openai: "productivity",
  chatgpt: "productivity",
  "disney+": "streaming",
  "amazon prime": "streaming",
  icloud: "cloud",
  "google one": "cloud",
  "microsoft 365": "productivity",
  "adobe creative cloud": "design",
};

export const KNOWN_BILLS: Record<string, string> = {
  "ranelagh rent": "bills",
  "electric ireland": "bills",
  "vodafone bill pay": "bills",
  vodafone: "bills",
  "three ireland": "bills",
  eir: "bills",
  "gas networks ireland": "bills",
  upc: "bills",
  sky: "bills",
};

export const PRODUCT_BOUNDARIES = {
  FINANCE: "finance",
  SUBSCRIPTION: "subscription",
  INVOICE: "invoice",
  SIGNALS: "signals",
} as const;
