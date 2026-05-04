# Mulah – Replit Boot‑up Instructions for Claude Dev Environment

> **Purpose:** This document tells Replit’s AI (Claude Sonnet 4.0) *exactly* how to recognise, build, and run the Mulah project from scratch.

---

## 1. Repository Layout

```
/ (project root)
├── README.md                # Short project overview
├── mulah_spec.md            # Full product spec (copy from Mulah_Full_Text Doc)
├── replit.ai-context        # Files Claude should prioritise
├── package.json             # Node/Express backend starter
├── /src
│   ├── server.js            # Express server with basic API routes
│   ├── /routes              # REST endpoints (users, subs, usw, usw-runs)
│   ├── /controllers         # Logic and validation
│   ├── /models              # Data models (using Prisma or Sequelize)
│   └── /services            # External API wrappers (Stripe, TrueLayer etc.)
├── /public                  # Static assets (logo, index.html, tailwind.css)
│   ├── index.html
│   ├── dashboard.html
│   └── script.js
└── /scripts                 # Dev helpers (seed db, run schedulers)
```

> **Important:** Claude must read \`\` then `README.md`, then code.

---

## 2. AI Context File

Create **replit.ai-context** with:

```
mulah_spec.md
README.md
```

This forces Replit’s Claude to ingest our product spec first.

---

## 3. Environment Variables (Replit Secrets)

```
DATABASE_URL       # connection string for Supabase/Postgres
STRIPE_KEY         # Stripe Secret Key (test)
STRIPE_ISSUING_KEY # Stripe Issuing (test or mock)
OPENAI_KEY         # GPT insights engine
MAILGUN_KEY        # email alerts
MESH_KEY           # placeholder for merchant sync API
PAYDAY_DEFAULT     # default date (e.g., 25)
```

> Set these in **Secrets** tab – not checked into code.

---

## 4. NPM Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node scripts/seed.js",
    "schedule": "node scripts/scheduler.js"
  }
}
```

---

## 5. First‑Run Tasks for Claude (ask it to do these in order)

1. **Branding Update** – Replace all hard‑coded app names with `Mulah` constants.
2. **Tailwind Setup** – Install Tailwind, configure colors:
   ```js
   module.exports = {
     theme: {
       extend: {
         colors: {
           mulah: {
             green: '#10B981',
             mint:  '#F0FDF4',
             night: '#0F172A'
           }
         }
       }
     }
   }
   ```
3. **Create Subscription Model** – `id, userId, name, cost, cycle, nextDate, category`.
4. **USW Logic** – endpoint `POST /api/usw/run` that:
   - Calculates total
   - Checks run limits vs premium
   - Returns fee + run summary (no real payout yet)
5. **Dashboard Refresh** – Pull data from `/api/subscriptions`, show fee preview modal.
6. **Mock Insights** – simple `/api/insights` route returning sample JSON ("You spent 20% more on Streaming").

---

## 6. Suggested Dev Flow

```
1. git add .
2. git commit -m "feat: init Mulah base"
3. yarn dev  # or npm run dev
4. Visit live URL, verify branding + basic dashboard.
```

Claude should iterate after each commit.

---

## 7. Future Modules (for Claude’s roadmap)

- `/api/mesh/*` – Mulah Mesh endpoints (placeholder)
- `/api/ubw/*` – bill wallet logic
- Stripe Issuing service methods in `services/stripeCards.js`
- Insights engine worker (`scripts/insightsWorker.js`)
- Scheduler cron (`scripts/scheduler.js`) using node‑cron

---

## 8. Quick Testing Checklist

1. Add a subscription (Netflix €10, 12th)
2. Run `/api/usw/run` – should return fee 0 if within premium cap.
3. Add fourth sub – run again, see €1 fee.
4. Tweak `isPremium = false` flag – verify run limit enforcement.

---

**Hand this doc to Replit AI and tell it: “Use these instructions to refactor the repo into Mulah.”**

That’s it – Claude now has every instruction needed.

