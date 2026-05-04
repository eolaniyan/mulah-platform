# Replit ↔ Cursor Real-Time Sync via GitHub

GitHub is the live shared brain between Replit and Cursor. Neither tool needs to know the other exists — they both just use the repo.

---

## The model

```
Replit (rapid iteration)
  │
  │  node scripts/push-to-github.mjs [file...]
  ▼
GitHub (eolaniyan/mulah-platform) ← source of truth
  ▲
  │  normal git push / git pull
  │
Cursor (production work)
```

- **Replit → GitHub**: Run `node scripts/push-to-github.mjs` from the shell (or call it from a code_execution cell). Pushes specific files via the Replit GitHub connector (no PAT required).
- **Cursor → GitHub**: Normal `git add / commit / push`. Cursor always has full git access.
- **GitHub → Replit** (reading Cursor changes): Call `GET /repos/eolaniyan/mulah-platform/contents/{path}` via the connector to read any file Cursor has pushed back.

---

## What lives in GitHub and is authored in Replit

| File / directory | Purpose |
|-----------------|---------|
| `CURSOR.md` | Sprint tasks, product boundaries, architecture decisions — the brief for Cursor |
| `packages/shared-logic/` | Shared API client + hooks + utils — built here, consumed by both web + mobile |
| `docs/decisions/` | ADR files — written wherever, read everywhere |
| `docs/REPLIT_CURSOR_SYNC.md` | This file |

---

## Workflow: making a change and syncing

### From Replit
1. Edit the file (e.g. add a new hook to `packages/shared-logic/src/hooks/useFinance.ts`)
2. Push it to GitHub:
   ```
   node scripts/push-to-github.mjs packages/shared-logic/src/hooks/useFinance.ts
   ```
3. Cursor will see the change on next `git pull`

### From Cursor
1. Edit any file and `git push` to master (or a PR branch)
2. To pull a Cursor change into Replit, use the code_execution connector to read it:
   ```js
   const res = await connectors.proxy("github", "/repos/eolaniyan/mulah-platform/contents/path/to/file");
   const data = await res.json();
   const content = Buffer.from(data.content, "base64").toString("utf8");
   ```

---

## Updating CURSOR.md (the Cursor task brief)

`CURSOR.md` in the repo root is how Replit communicates new tasks to Cursor. When you want Cursor to do something:

1. Edit `CURSOR.md` in Replit
2. Run: `node scripts/push-to-github.mjs CURSOR.md`
3. Cursor reads it from the repo and acts on it

This replaces any ad-hoc instruction passing — GitHub is the message bus.

---

## What NOT to sync from Replit

Do not push these (they're Replit-specific and would break the monorepo):

- `package.json` at the Replit root (different from monorepo root)
- `server/` (maps to `services/api/src/` — only push specific files, not the whole dir)
- `client/` (maps to `apps/finance-web/src/` — let Cursor handle migration)
- `.replit`, `replit.nix`, `vite.config.ts` (Replit-specific config)
- `node_modules/`
