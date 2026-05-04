import type { InsertAppConfig } from "@shared/schema";

export const appConfigSeed: InsertAppConfig[] = [
  {
    key: "usw_fees",
    value: {
      baseFee: 3.99,
      perSubscriptionFee: 1.00,
      freeSubscriptions: 3,
      premiumDiscount: 1.0,
      currency: "EUR",
      maxNonPremiumCharge: 200
    },
    description: "USW (Unified Subscription Wallet) fee configuration",
    isPublic: true,
  },
  {
    key: "usw_eligibility",
    value: {
      minSubscriptions: 1,
      maxSubscriptions: 50,
      allowedBillingCycles: ["monthly", "yearly", "weekly"],
      excludedCategories: []
    },
    description: "USW eligibility requirements",
    isPublic: true,
  },
  {
    key: "feature_flags",
    value: {
      uswEnabled: true,
      virtualCardsEnabled: false,
      meshSyncEnabled: false,
      bnplBufferEnabled: false,
      aiInsightsEnabled: true,
      conciergeEnabled: true,
      openBankingEnabled: false
    },
    description: "Feature flags for enabling/disabling platform features",
    isPublic: true,
  },
  {
    key: "subscription_categories",
    value: [
      { id: "streaming", name: "Streaming & Entertainment", icon: "fa-play", color: "#E50914" },
      { id: "music", name: "Music & Audio", icon: "fa-music", color: "#1DB954" },
      { id: "software", name: "Software & Productivity", icon: "fa-laptop", color: "#3B82F6" },
      { id: "cloud", name: "Cloud & Storage", icon: "fa-cloud", color: "#38BDF8" },
      { id: "gaming", name: "Gaming", icon: "fa-gamepad", color: "#7C3AED" },
      { id: "fitness", name: "Health & Fitness", icon: "fa-dumbbell", color: "#10B981" },
      { id: "news", name: "News & Publications", icon: "fa-newspaper", color: "#F59E0B" },
      { id: "education", name: "Education & Learning", icon: "fa-graduation-cap", color: "#8B5CF6" },
      { id: "food", name: "Food & Delivery", icon: "fa-utensils", color: "#EF4444" },
      { id: "utilities", name: "Utilities & Bills", icon: "fa-bolt", color: "#F97316" },
      { id: "financial", name: "Financial Services", icon: "fa-credit-card", color: "#059669" },
      { id: "other", name: "Other", icon: "fa-star", color: "#6B7280" }
    ],
    description: "Available subscription categories with icons and colors",
    isPublic: true,
  },
  {
    key: "control_methods",
    value: {
      mulah_merchant: {
        name: "Instant Control",
        description: "Cancel, pause, or modify instantly through Mulah",
        icon: "fa-bolt",
        color: "#10B981",
        badge: "Mulah Partner"
      },
      api: {
        name: "Connected Control",
        description: "Automated control via service API connection",
        icon: "fa-plug",
        color: "#3B82F6",
        badge: "API Connected"
      },
      self_service: {
        name: "Self-Service",
        description: "Manage directly on the service's website",
        icon: "fa-arrow-up-right-from-square",
        color: "#F59E0B",
        badge: "External"
      },
      concierge: {
        name: "Concierge Assisted",
        description: "Our team handles the cancellation for you",
        icon: "fa-headset",
        color: "#8B5CF6",
        badge: "Mulah Concierge"
      }
    },
    description: "Control method definitions and display configuration",
    isPublic: true,
  },
  {
    key: "billing_cycles",
    value: [
      { id: "weekly", name: "Weekly", multiplier: 4.33, shortName: "wk" },
      { id: "monthly", name: "Monthly", multiplier: 1, shortName: "mo" },
      { id: "quarterly", name: "Quarterly", multiplier: 0.33, shortName: "qtr" },
      { id: "yearly", name: "Yearly", multiplier: 0.083, shortName: "yr" }
    ],
    description: "Available billing cycle options with monthly conversion multipliers",
    isPublic: true,
  },
  {
    key: "currencies",
    value: {
      default: "EUR",
      supported: ["EUR", "USD", "GBP"]
    },
    description: "Supported currencies configuration",
    isPublic: true,
  }
];
