# ADR-0002: Product boundaries (Mulah Finance as flagship)

## Status
Accepted

## Context
Mulah is an ecosystem of marketable products that should be able to evolve independently, while still feeling like one cohesive platform for users.

Historically, the codebase grew by copying/iterating multiple “full-stack” repos. That approach is not sustainable because it duplicates identity, data models, business logic, and notifications across products.

We need explicit boundaries so we can restructure the monorepo once and avoid disruptive rewrites later.

## Decision
We will treat **Mulah Finance** as the flagship product, and structure the repo around:

- **One shared platform foundation** (internal, not marketed as its own product)
- **Four marketable products/apps** built on the foundation

### Marketable products (apps)

#### 1) Mulah Finance (flagship)
The household finance OS powered by CFA.

Owns:
- CFA runs (“tell me something real” narratives + chapters + actions)
- Household mode (members, roles, privacy scopes, contribution rules)
- Fairness + contribution drift
- Resilience / stress testing (runway + shock scenarios + action plans)
- True spend vs cash view (expense attribution: **paid on** vs **belongs to**)
- Goals, plans, obligations

Does not own:
- Subscription identity resolution workflows (separate product surface)
- SMB invoicing workflows
- Investing execution workflows

#### 2) Mulah Subscription
Subscription identity + unknown charge resolution.

Owns:
- Recurring detection → subscription objects
- Unknown charge resolution (Apple/Google/PayPal/Revolut-style generic descriptors)
- Renewal forecasting + price-change detection + duplicates
- Cancellation guidance (initially guided; concierge later)

#### 3) Mulah Invoice
SMB invoicing + getting paid.

Owns:
- Invoices, clients, items, templates, reminders
- Payment status tracking + payment link workflows
- Tier limits / upgrade prompts and invoice-specific business rules

#### 4) Mulah Signals
Plain-English investing companion (approve-to-execute; not discretionary management).

Owns:
- Broker connections + portfolio import
- Plain-English opportunity cards + approvals
- Risk guardrails + behavioural protection
- Goal-based investing modes

### Shared foundation (platform)
The foundation is internal. It exists to prevent re-implementing the same primitives across apps.

Owns:
- Identity: users, households, roles, privacy scopes
- Money data model: accounts, transactions, merchants, categories
- Recurring primitives: recurring clusters, subscription candidates, evidence/confidence
- Attribution primitives: paid-on vs belongs-to, splits, allocations
- Events: “something changed” signals emitted from the engines
- Evidence + audit: why we classified something; confidence; user overrides
- Entitlements: cross-product plans, feature flags, limits

## Consequences
- The monorepo folder structure and naming must reflect these product boundaries.
- New features must be assigned to one of:
  - a specific app (Finance / Subscription / Invoice / Signals), or
  - the shared foundation
- “Alerting/inbox” is a shared UX pattern inside products (and a shared platform capability), not a standalone marketed product at this stage.

## Implementation notes (repo structure)
Preferred app naming in `apps/`:
- `apps/finance-*` (flagship surfaces)
- `apps/subscription-*`
- `apps/invoice-*`
- `apps/signals-*` (investing)

Shared foundation in `packages/` and shared services in `services/`.

