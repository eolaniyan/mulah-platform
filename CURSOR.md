# Mulah — Cursor Coordination Guide

This document is the single source of truth for what Cursor should build in the `mulah-platform` monorepo. It is kept in sync with work happening in Replit (which covers `apps/finance-web` and rapid API iteration).

---

## Repo & tooling

- **Repo**: `github.com/eolaniyan/mulah-platform`
- **Package manager**: pnpm (workspace)
- **Primary IDE**: Cursor (this file)
- **Parallel tool**: Replit (builds `apps/finance-web` UI + `services/api` routes)
- **Mobile deploy**: Expo EAS (`apps/finance-mobile`)
- **Web deploy**: Vercel (`apps/finance-web`, `apps/signals`)

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
| `packages/shared-logic` | Shared API client + React Query hooks + utilities | **NEW — just created in Replit, copy here** |

---

## Sprint 1 — Foundation (your priority right now)

### Task 1.1 — Add `packages/shared-logic` to the monorepo

Replit has created the `packages/shared-logic` package. Copy it into the monorepo exactly as-is and wire it into the workspace.

**Files to copy from Replit's `packages/shared-logic/`:**
```
packages/shared-logic/
  package.json          (@mulah/shared-logic)
  tsconfig.json
  src/
    index.ts
    constants/index.ts
    api/
      client.ts         ← platform-agnostic fetch wrapper
      auth.ts
      subscriptions.ts
      analytics.ts
      iris.ts
      finance.ts        ← virtual cards, bank, USW, buffer, mesh, payments, support
    hooks/
      useAuth.ts
      useSubscriptions.ts
      useCFA.ts
      useIRIS.ts
      useFinance.ts
    utils/
      formatters.ts
      cfa.ts            ← calculateHealthScore() mirrors Python health_score_engine.py exactly
      subscriptions.ts
```

Then update the root `pnpm-workspace.yaml` to include `packages/*` if not already there.

---

### Task 1.2 — Wire `apps/finance-mobile` to use `@mulah/shared-logic`

**Goal:** Remove all duplicated API calls and data hooks from the mobile app. Replace with shared-logic imports.

Steps:
1. Add `@mulah/shared-logic` to `apps/finance-mobile/package.json` dependencies
2. At app startup in `App.tsx`, call:
   ```ts
   import { setApiBaseUrl, setTokenProvider } from "@mulah/shared-logic";
   import * as SecureStore from "expo-secure-store";
   setApiBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? "https://your-api.replit.app");
   setTokenProvider(() => SecureStore.getItemAsync("auth_token"));
   ```
3. Replace all `src/lib/api.ts` usages in each screen with the appropriate hook from `@mulah/shared-logic`
4. Delete `apps/finance-mobile/src/lib/api.ts` once all usages are replaced

**Screen → Hook mapping:**

| Screen | Replace with hook |
|--------|------------------|
| HomeScreen | `useAuth`, `useSubscriptions`, `useHealthScore` |
| SubscriptionDashboard | `useSubscriptions`, `useCFA` |
| AddSubscriptionScreen | `useCreateSubscription`, `useCategories` |
| USWScreen | `useUSWCalculation`, `useRunUSW`, `useUSWTransactions` |
| VirtualCardsScreen | `useVirtualCards`, `useCreateVirtualCard`, `useDeleteVirtualCard` |
| FamilyScreen | `useSubscriptions`, `useSubscriptionFamilyEligibility` |
| CalendarScreen | `useUpcomingBills`, `useSubscriptions` |
| ConciergeScreen | (support API) `supportApi.createCase` |
| CashflowScreen | `useCashflow`, `useCFA` |
| InsightsScreen | `useHealthScore`, `useAnalyticsInsights`, `useCategoryTotals` |
| AnalyticsScreen | `useMonthlyAnalytics`, `useSpendingTrends`, `useCategoryTotals` |
| ProfileScreen | `useAuth`, `useCompleteOnboarding` |
| IRISScreen | `useIRISAsk`, `useIRISNavigation`, `buildIRISContext` |

---

### Task 1.3 — Wire `apps/finance-web` to use `@mulah/shared-logic`

**Goal:** Replace the web app's direct fetch calls with shared-logic hooks where they exist.

Steps:
1. Add `@mulah/shared-logic` to `apps/finance-web/package.json`
2. In `apps/finance-web/src/main.tsx` or `App.tsx`, call:
   ```ts
   import { setApiBaseUrl } from "@mulah/shared-logic";
   setApiBaseUrl(""); // empty = same origin (works for Replit/Vercel)
   ```
3. Replace individual hook files in `apps/finance-web/src/hooks/` with re-exports from `@mulah/shared-logic` where the hook already exists
4. Keep any web-specific hooks (e.g. `useProactiveHelp`) in the web app

**Priority replacements for finance-web:**
- `useAuth` → `@mulah/shared-logic`
- Any inline `fetch("/api/subscriptions")` calls → `useSubscriptions` from shared-logic
- Any inline CFA fetch calls → `useCFA`, `useHealthScore` from shared-logic

---

### Task 1.4 — Build `apps/subscription-web` MVP

Subscription-web is currently a placeholder. Build it as a **standalone React + Vite app** targeting the shared API.

**Tech stack to use:**
- React 18 + TypeScript + Vite (match finance-web)
- Tailwind CSS (match finance-web)
- `@mulah/shared-logic` for all data fetching
- Same Replit Auth (`/api/login`, `/api/auth/user`)

**Screens to build:**

1. **Dashboard** — detected subscriptions list, total spend, unknown charges count
2. **Detection results** — output of `POST /api/subscriptions/detect`, cards per detected subscription with confidence score
3. **Renewals calendar** — monthly calendar view of upcoming subscription charges
4. **Unknown charge resolver** — interface to classify unrecognised transaction descriptions
5. **Subscription detail** — per-subscription: history, price trend, cancel guidance

**API it will consume** (all already exist in `services/api`):
- `GET /api/subscriptions`
- `POST /api/subscriptions/detect`
- `GET /api/subscriptions/management`
- `GET /api/analytics/upcoming`
- `GET /api/bank-transactions`

---

### Task 1.5 — Build `apps/signals` foundation screens

Signals is bootstrapped as a Next.js 16 app. Build these screens — all are data display only, no investment advice:

1. **Portfolio overview** — manual entry or CSV import of holdings; total value, allocation by asset type
2. **Performance tracking** — holdings vs benchmark (SP500, ISEQ) — display only, user-entered data
3. **Opportunity cards** — curated market move cards (fetch from a free market API like Yahoo Finance / Alpha Vantage); each card: asset name, move %, relevant news headline, risk level badge
4. **Risk visualization** — concentration chart (sector/geography exposure from portfolio data)
5. **Goals** — user sets a goal (e.g. "€50k by 2027"), app tracks trajectory based on current portfolio value and target

**Important:** Do NOT build anything that:
- Personalizes recommendations based on portfolio (that's regulated advice)
- Has an "approve to execute" flow that connects to a broker (hold this for later)

**Tech:** Next.js 16 App Router, Tailwind v4, React 19. `packages/shared-logic` for any calls to the shared API. Market data: free tier of Alpha Vantage or Yahoo Finance (no API key needed for basic quotes).

---

## Ongoing rules — never break these

### Schema alignment
When changing `packages/types/src/schema.ts`, update `apps/finance-mobile` types at `src/types/index.ts` to match. Replit uses `@shared/schema` (same file, different alias). Do not let them drift.

### API contract alignment
Never rename or remove an existing API route in `services/api/src/routes.ts` without updating:
1. `packages/shared-logic/src/api/` — the relevant api file
2. The hook in `packages/shared-logic/src/hooks/`
3. All screens in `apps/finance-mobile` that call it
4. All pages in `apps/finance-web` that call it

### Product boundary enforcement
Feature belongs in... | Build it in
--- | ---
Household finance, CFA, budgets | `apps/finance-web` + `apps/finance-mobile`
Subscription detection, unknown charges | `apps/subscription-web`
Portfolio, market data, investing | `apps/signals`
Data fetching hooks & API calls | `packages/shared-logic`
DB schema, insert/select types | `packages/types`
Backend routes, auth, services | `services/api`

### Shared-logic hygiene
- Every new API endpoint added to `services/api` → add a corresponding function in `packages/shared-logic/src/api/`
- Every new data-fetching pattern → add a hook in `packages/shared-logic/src/hooks/`
- Never put UI code in `packages/shared-logic`
- Never put business logic that belongs in `packages/shared-logic` directly inside a screen component

---

## Division of labour: Cursor vs Replit

| Work area | Who builds it |
|-----------|--------------|
| `apps/finance-web` pages + components | **Replit** |
| `apps/finance-mobile` screens | **Cursor** |
| `apps/subscription-web` (new app) | **Cursor** |
| `apps/signals` screens | **Cursor** |
| `packages/shared-logic` | Created by Replit, maintained by **both** |
| `packages/types` schema changes | **Cursor** (precision + cross-file refactoring) |
| `services/api` new routes | **Replit** (fast iteration) |
| `services/api` service logic | **Cursor** (TypeScript precision) |
| Monorepo plumbing (workspace, CI, EAS, Vercel config) | **Cursor** |

---

## Architecture decisions already made (do not re-litigate)

- **Mulah Invoice is archived** — different customer (SMB), revisit at Series A
- **Mulah Signals regulatory line** — no personalised recommendations, no execute flow yet; build data display and opportunity cards only
- **Single backend** (`services/api`) serves all four apps via shared auth (Replit Auth / OpenID Connect)
- **Shared logic** lives in `packages/shared-logic`, not duplicated per app
- **Mobile = native** (`apps/finance-mobile` via Expo, NOT React Native Web)
- **Web = Vite/React** for finance and subscription; **Next.js 16** for signals
- **Currency**: EUR default throughout (Irish market focus)
- **Categories**: "Subscriptions", "Groceries", "Transport", "Fuel", "Lifestyle", "Bills", "Income", "General"

---

## Financial algorithm reference (match exactly)

### Health score (calculateHealthScore in packages/shared-logic/src/utils/cfa.ts)
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
Low risk: ≥ 80, Medium: ≥ 60, High: < 60
```

### Recurring confidence
```
recurring_confidence = (amount_consistency + interval_consistency) / 2
threshold for "is recurring" = 0.5
threshold for "high confidence" = 0.85
```
