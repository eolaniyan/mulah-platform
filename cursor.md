# Mulah Platform — Cursor context

This repo is the **canonical Mulah monorepo**. Default Git branch: **`master`**.

## Product boundaries (source of truth)

Read **`docs/decisions/ADR-0002-product-boundaries.md`** before adding features.

| Product | Path (apps) | Role |
|--------|-------------|------|
| **Mulah Finance** (flagship) | `apps/finance-web`, `apps/finance-mobile` | Household OS + CFA + resilience + true spend |
| **Mulah Subscription** | `apps/subscription-web` (scaffold) | Subscription identity, unknown charges, renewals |
| **Mulah Invoice** | `apps/invoice-web` (scaffold) | SMB invoicing + payments |
| **Mulah Signals** (investing) | `apps/signals` | Plain-English investing companion |

Shared backend / types live under **`services/`** and **`packages/`**. Do not duplicate identity, transactions, or billing logic across apps—extend the shared foundation.

## Dev entrypoints (pnpm)

From repo root:

- `pnpm dev:finance-web` — flagship web
- `pnpm dev:finance-mobile` — Expo mobile
- `pnpm dev:signals` — investing Next app
- `pnpm dev:subscription-web` / `pnpm dev:invoice-web` — placeholders until wired

## Legacy / archive

- **`archive/legacy/`** — preserved snapshots; do not treat as active product surface.
- Archived `.replit` may contain **redacted** placeholders; never commit real API keys.

## Git nudges (optional)

- **`scripts/git-nudge.ps1`** — popup if uncommitted or unpushed work exists.
- **`scripts/setup-git-nudge-task.ps1`** — registers a Windows scheduled task.

## Working across Cursor and Replit

- Clone/pull **`master`** from `https://github.com/eolaniyan/mulah-platform.git`.
- Prefer **one branch per task**; merge via PR when collaborating; push before switching machines.

## ADRs

- `docs/decisions/ADR-0001-monorepo-migration.md`
- `docs/decisions/ADR-0002-product-boundaries.md`
