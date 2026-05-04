# Mulah — Cursor Coordination Guide

This document is the **single source of truth** for what Cursor should build in the `mulah-platform` monorepo.
It is kept in sync with work happening in Replit (which owns `apps/finance-web` and `services/api` rapid iteration).

**Last synced:** May 2026

---

## Repo & tooling

- **Repo**: `github.com/eolaniyan/mulah-platform`
- **Package manager**: pnpm (workspace)
- **Primary IDE**: Cursor (this file)
- **Parallel tool**: Replit (builds `apps/finance-web` UI + `services/api` routes)
- **Mobile deploy**: Expo EAS (`apps/finance-mobile`)
- **Web deploy**: Vercel (`apps/finance-web`, `apps/signals`)

---

## Division of labour: Cursor vs Replit

| Work area | Who builds it |
|-----------|--------------|
| `apps/finance-web` pages + components | **Replit** |
| `apps/finance-mobile` screens | **Cursor** |
| `apps/subscription-web` (new app) | **Cursor** |
| `apps/signals` screens | **Cursor** |
| `packages/shared-logic` | Created by Replit, maintained by **both** |
| `packages/types` schema changes | **Cursor** |
| `services/api` new routes | **Replit** (fast iteration) |
| `services/api` service logic | **Cursor** (TypeScript precision) |
| Monorepo plumbing (workspace, CI, EAS, Vercel config) | **Cursor** |

---

## Product boundaries (ADR-0002 — DO NOT mix these)

| App | Owns | Status |
|-----|------|--------|
| `apps/finance-web` | Household finance OS — CFA, IRIS, household mode, goals | Active |
| `apps/finance-mobile` | Same as finance-web, native iOS/Android | Active |
| `apps/subscription-web` | Subscription identity, unknown charges, renewals, cancellation | Placeholder → build |
| `apps/signals` | Investing companion — portfolio, market data, opportunity cards | Bootstrapped (Next.js 16) |
| `services/api` | Shared Express.js backend serving all apps | Active |
| `packages/types` | Shared Drizzle schema + TypeScript types | Active |
| `packages/shared-logic` | Shared API client + React Query hooks + utilities | **Active — use this for all data fetching** |

---

## Mobile App Setup (`apps/finance-mobile`)

### Step 1 — Wire shared-logic at app startup

In `App.tsx` (before rendering any navigation):

```ts
import { setApiBaseUrl, setTokenProvider } from "@mulah/shared-logic";
import * as SecureStore from "expo-secure-store";

setApiBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? "https://mulah-api.replit.app");
setTokenProvider(() => SecureStore.getItemAsync("auth_token"));
```

### Step 2 — Screen → Hook mapping (use ONLY these hooks, do not write raw fetch calls)

| Screen | Hook(s) to use |
|--------|----------------|
| HomeScreen | `useAnalyticsSummary`, `useSubscriptions`, `useHealthScore` |
| SubscriptionDashboard | `useSubscriptions`, `useAnalyticsSummary` |
| AddSubscriptionScreen | `useCreateSubscription`, `useCategories` |
| USWScreen | `useUSWCalculation`, `useRunUSW`, `useUSWTransactions` |
| VirtualCardsScreen | `useVirtualCards`, `useCreateVirtualCard`, `useDeleteVirtualCard` |
| FamilyScreen | `useSubscriptions`, `useSubscriptionFamilyEligibility` |
| CalendarScreen | `useUpcomingBills`, `useSubscriptions` |
| ConciergeScreen | `supportApi.createCase`, `supportApi.getCases` |
| CashflowScreen | `useCashflow`, `useCFA` |
| InsightsScreen | `useHealthScore`, `useAnalyticsInsights`, `useCategoryTotals` |
| AnalyticsScreen | `useMonthlyAnalytics`, `useSpendingTrends`, `useCategoryTotals` |
| ProfileScreen | `useAuth`, `useCompleteOnboarding` |
| IRISScreen | `useIRISAsk`, `useIRISNavigation`, `buildIRISContext` |

---

## Complete API Reference

Base URL is set via `setApiBaseUrl()`. All endpoints require authentication (Replit Auth cookie/token) except where noted.

Auth header for mobile: `Authorization: Bearer <token>` (set via `setTokenProvider`).

---

### Auth

#### `GET /api/auth/user`
Returns the currently authenticated user.
```ts
// Response
{
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  onboardingComplete?: boolean;
}
```

#### `POST /api/auth/onboarding-complete`
Mark onboarding as done.
```ts
// Response
{ success: true }
```

---

### Subscriptions

#### `GET /api/subscriptions`
Returns all subscriptions for the authenticated user.
```ts
// Response: Subscription[]
{
  id: number;
  userId: string;
  name: string;
  cost: string;                // e.g. "13.49"
  currency: string;            // "EUR"
  billingCycle: string;        // "monthly" | "yearly" | "weekly"
  nextBillingDate: string;     // ISO date string
  category: string;            // "streaming" | "music" | "cloud" | etc.
  status: string;              // "active" | "paused" | "cancelled"
  isActive: boolean;
  iconColor?: string | null;
  iconName?: string | null;
  description?: string | null;
  website?: string | null;
  createdAt?: string;
}
```

#### `POST /api/subscriptions`
Create a new subscription.
```ts
// Body
{
  name: string;
  cost: string;
  currency?: string;           // default "EUR"
  billingCycle: string;        // "monthly" | "yearly" | "weekly"
  nextBillingDate: string;     // ISO date string
  category: string;
  status?: string;             // default "active"
  isActive?: boolean;          // default true
  iconColor?: string;
  iconName?: string;
  description?: string;
  website?: string;
}
// Response: Subscription (see above)
```

#### `PUT /api/subscriptions/:id`
Update a subscription.
```ts
// Body: Partial<Subscription fields above>
// Response: Subscription
```

#### `DELETE /api/subscriptions/:id`
Delete a subscription.
```ts
// Response: { message: "Subscription deleted" }
```

#### `GET /api/subscriptions/:id/family-eligibility`
Check if a subscription can be shared with family.
```ts
// Response
{
  eligible: boolean;
  reason?: string;
  maxMembers?: number;
}
```

#### `POST /api/subscriptions/detect`
Run AI detection on bank transactions to find recurring subscriptions.
```ts
// Body (optional)
{ transactionIds?: number[] }
// Response
{
  detected: Subscription[];
  confidence: number;
}
```

#### `GET /api/subscriptions/management`
Returns subscription management metadata (cancellation info, price change history).
```ts
// Response: Array of management objects per subscription
```

---

### Analytics

#### `GET /api/analytics`
**Home screen summary.** Returns subscription totals + upcoming renewals.
```ts
// Response
{
  monthlyTotal: number;        // total monthly subscription spend (EUR)
  annualTotal: number;         // projected annual spend
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  upcomingRenewals: Subscription[];  // renewals due in next 30 days
}
```
**Hook:** `useAnalyticsSummary()`

#### `GET /api/cfa/summary`
**CFA Insights — the core financial intelligence engine.**
```ts
// Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// Response
{
  healthScore: number;         // 0-100
  riskLevel: string;           // "low" | "moderate" | "high" | "critical"
  savingsRate: number;         // percentage e.g. 11
  subscriptionBurden: number;  // percentage of income spent on subscriptions
  monthlyNetIncome: number;    // average monthly surplus (EUR)
  insights: Array<{
    type: string;
    severity: "info" | "warning" | "success" | "error";
    title: string;
    description: string;
    action?: string;           // action label for CTA button
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
  }>;
  patterns: Array<{
    name: string;
    description: string;
    trend: "up" | "down" | "stable";
  }>;
  resilience: {
    emergencyFundMonths: number;
    incomeStability: number;   // 0-100
    expenseFlexibility: number; // 0-100
  };
}
```
**Hook:** `useCFA()` / `useHealthScore()`

#### `GET /api/analytics/cashflow`
**Single cashflow summary object (NOT an array).**
```ts
// Response
{
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
  isSubscriptionBased: boolean;  // true if derived from subs only (no bank txns)
}
```
**Hook:** `useCashflow()`

#### `GET /api/analytics/upcoming?days=N`
Returns upcoming subscription renewals (default 30 days).
```ts
// Response: UpcomingBill[] where each item has:
{
  id: number;
  name: string;
  cost: string;              // e.g. "13.49"
  billingCycle: string;
  nextBillingDate: string;   // ISO date
  category: string;
  iconColor?: string | null;
  isActive: boolean;
  status: string;
}
```
**Hook:** `useUpcomingBills(days?)`

#### `GET /api/analytics/monthly`
Monthly spend totals (array, one entry per month).
```ts
// Response: Array<{ month: string; total: number; count: number }>
```
**Hook:** `useMonthlyAnalytics()`

#### `GET /api/analytics/spending-trends`
Spending trends over time.
```ts
// Response: Array<{ period: string; amount: number; change: number; changePercent: number }>
```
**Hook:** `useSpendingTrends()`

#### `GET /api/analytics/category-totals`
Spend broken down by category.
```ts
// Response: Array<{ category: string; total: number; percentage: number; count: number }>
```
**Hook:** `useCategoryTotals()`

#### `GET /api/analytics/insights`
AI-derived smart insights.
```ts
// Response: { insights: CFAInsight[] }
```
**Hook:** `useAnalyticsInsights()`

---

### Bank Transactions

#### `GET /api/bank-transactions`
Returns all bank transactions for the user.
```ts
// Response: BankTransaction[]
{
  id: number;
  userId: string;
  bankConnectionId: number;
  transactionId: string;
  transactionDate: string;   // ISO date
  amount: string;            // positive = expense, negative = income credit
  currency: string;
  description: string;
  merchantName?: string | null;
  category?: string | null;
  confidence?: string | null;
  direction: "in" | "out";
  isSubscriptionPayment?: boolean;
}
```
**Hook:** `useBankTransactions()`

#### `GET /api/bank-connections`
Returns linked bank accounts.
**Hook:** `useBankConnections()`

---

### Virtual Cards

#### `GET /api/virtual-cards`
```ts
// Response: VirtualCard[]
{
  id: number;
  userId: string;
  stripeCardId: string;
  last4: string;
  brand: string;             // "visa"
  status: "active" | "frozen" | "cancelled";
  spendingLimit?: string | null;
  merchantRestrictions?: string[];
  assignedToSubscription?: string | null;
}
```
**Hook:** `useVirtualCards()`

#### `POST /api/virtual-cards`
```ts
// Body
{ spendingLimit?: string; assignedToSubscription?: string; merchantRestrictions?: string[] }
// Response: VirtualCard
```
**Hook:** `useCreateVirtualCard()`

#### `PATCH /api/virtual-cards/:id`
```ts
// Body: { status?: "active" | "frozen" | "cancelled"; spendingLimit?: string; ... }
// Response: VirtualCard
```

#### `DELETE /api/virtual-cards/:id`
```ts
// Response: { message: string }
```
**Hook:** `useDeleteVirtualCard()`

---

### USW (Unified Subscription Wallet)

#### `GET /api/usw/calculate`
```ts
// Response
{
  totalMonthly: number;
  totalAnnual: number;
  potentialSavings: number;
  subscriptionCount: number;
  breakdown: Array<{ name: string; cost: number; dueDate: string }>;
}
```
**Hook:** `useUSWCalculation()`

#### `POST /api/usw/run`
```ts
// Body (optional): { subscriptionIds?: number[] }
// Response: { success: boolean; message: string }
```
**Hook:** `useRunUSW()`

#### `GET /api/usw/transactions`
**Hook:** `useUSWTransactions()`

---

### IRIS AI Assistant

#### `POST /api/iris/ask`
```ts
// Body
{ message: string; context?: Record<string, unknown> }
// Response
{
  reply: string;
  context?: Record<string, unknown>;
  actions?: Array<{ label: string; route: string }>;
  confidence?: number;
}
```
**Hook:** `useIRISAsk()`

#### `GET /api/iris/navigation`
```ts
// Response
{
  suggestedRoutes: Array<{ label: string; route: string; reason: string }>;
}
```
**Hook:** `useIRISNavigation()`

#### `GET /api/iris/pages`
**Hook:** `useIRISPages()`

#### Helper: `buildIRISContext(screenName, data)`
Builds the context object to pass to `useIRISAsk`. Import from `@mulah/shared-logic`.

---

### Support / Concierge

#### `POST /api/support/cases`
```ts
// Body
{ subject: string; description: string; priority?: "low" | "normal" | "high" | "urgent" }
// Response: SupportCase { id, userId, subject, status, priority, createdAt }
```

#### `GET /api/support/cases`
Returns all support cases for the user.

---

### Categories

#### `GET /api/categories`
Returns all subscription categories (no auth required).
```ts
// Response: Array<{ id: number; name: string; slug: string; icon?: string; color?: string }>
```
**Hook:** `useCategories()`

---

### Demo

#### `POST /api/demo/populate`
Loads 6 months of realistic Irish household data (salary, rent, groceries, subscriptions, transport).
Creates: 10+ subscriptions + ~120 bank transactions across 6 months.
```ts
// Response: { message: string; subscriptionsCreated: number; transactionsCreated: number }
```

#### `DELETE /api/demo/clear`
Removes all demo data for the user.

---

## Health Score Algorithm (match exactly)

```
base = 50
savings_rate >= 20%  → +25
savings_rate >= 10%  → +15
savings_rate > 0%    → +5
savings_rate <= 0%   → -15
recurring_ratio < 5% → +15
recurring_ratio < 10%→ +10
recurring_ratio < 20%→ +0
recurring_ratio >= 20%→ -10
net_cashflow > 0     → +10
net_cashflow <= 0    → -10
score = clamp(0, 100)
Low risk: score ≥ 80, Medium: ≥ 60, High: < 60
```

`healthScore` is returned directly by `/api/cfa/summary` — do NOT recalculate it on the client.

---

## Irish Market Constants

```ts
Currency: EUR
Salary range (demo): €3,850/month (Accenture Ireland)
Merchants: Tesco, Lidl, Aldi, Dunnes Stores, Electric Ireland, Gas Networks Ireland,
           Vodafone Ireland, Transport for Ireland (Luas), Circle K, Applegreen,
           Iarnród Éireann, Bewley's Café, Costa Coffee
Subscriptions (demo): Netflix €13.49, Spotify €9.99, Adobe CC €59.99, ChatGPT €20.00,
                      Gym Plus €49.99, Vodafone Broadband €49.99, iCloud+ €2.99,
                      YouTube Premium €11.99, Notion €8.00, NordVPN €3.99
Categories: "streaming" | "music" | "cloud" | "productivity" | "developer" |
            "design" | "security" | "health" | "fitness" | "finance" |
            "shopping" | "telecom" | "software" | "insurance"
```

---

## Architecture decisions (do not re-litigate)

- **Mulah Invoice is archived** — revisit at Series A
- **Mulah Signals** — no personalised recommendations, no broker execute flow yet
- **Single backend** (`services/api`) serves all four apps via Replit Auth
- **Shared logic** lives in `packages/shared-logic` — never duplicate API calls in screens
- **Mobile = native** (`apps/finance-mobile` via Expo EAS, NOT React Native Web)
- **Currency**: EUR throughout (Irish market)
- **cashflow endpoint returns a single object** — not an array — `useCashflow()` is typed correctly

## Schema alignment rules (never break)

1. `packages/types/src/schema.ts` is the source of truth for all field names
2. `VirtualCard.spendingLimit` (not `spendLimit`), `VirtualCard.assignedToSubscription` (not `linkedSubscriptionId`)
3. `BankTransaction.direction` = `"in" | "out"` (not `"credit" | "debit"`)
4. `Subscription.cost` is always a string (not number) — parse with `parseFloat()`
5. `Subscription.nextBillingDate` is an ISO date string

## Ongoing rules — never break

- Never rename or remove an existing API route without updating `packages/shared-logic/src/api/` + all consuming screens
- Every new API endpoint → add function to `packages/shared-logic/src/api/` → add hook to `packages/shared-logic/src/hooks/`
- Never put UI code in `packages/shared-logic`
- Never write raw `fetch()` calls inside a screen — always use a hook from `@mulah/shared-logic`
