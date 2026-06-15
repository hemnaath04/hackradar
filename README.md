# HackRadar 🛰️

A Luma-style directory of **hackathons happening in Boston and online across the USA**, aggregated **daily by an agent** from multiple sources. Built with Next.js 16 (App Router), Prisma 7 + SQLite, and Tailwind v4.

> One command refreshes the whole listing. Add a source by dropping one file in `lib/sources/`.

---

## How it works

```
┌──────────────┐     ┌───────────────────────────┐     ┌──────────────┐
│ Source       │     │ Aggregator (lib/aggregate)│     │ SQLite (dev) │
│ adapters     │ ──▶ │  • normalize              │ ──▶ │  upsert by   │
│ devpost, mlh │     │  • tag Boston/Online/USA  │     │  dedupeKey   │
└──────────────┘     │  • dedupe                 │     └──────┬───────┘
                     └───────────────────────────┘            │
        ▲                                                      ▼
        │                                          ┌────────────────────┐
   ┌────┴──────────────┐                           │ Next.js UI         │
   │ Trigger:          │                           │  filter / search   │
   │  • npm run scrape  │                          │  month-grouped feed│
   │  • GET /api/cron   │ ◀── daily cron           └────────────────────┘
   └───────────────────┘
```

The **same `runAggregation()`** runs from the CLI (`npm run scrape`) and the HTTP endpoint (`/api/cron`), so local and hosted behavior are identical.

## Run locally

```bash
npm install
npx prisma migrate dev      # creates dev.db
npm run scrape              # populate from Devpost + MLH
npm run dev                 # http://localhost:3000
```

## The daily agent

Pick one trigger:

| Where | How |
|-------|-----|
| Local (macOS/Linux) | `crontab -e` → `0 7 * * * cd /path/to/hackradar && /usr/local/bin/npm run scrape` |
| Your server | systemd timer or cron calling `npm run scrape` |
| Vercel | `vercel.json` already declares a daily cron hitting `/api/cron` at 07:00 UTC |

Set `CRON_SECRET` in production to lock down `/api/cron` (Vercel Cron sends the bearer token automatically).

## Sources

| Source | How | Notes |
|--------|-----|-------|
| **Devpost** | JSON API | Online + national hackathons |
| **MLH** | embedded season JSON | College hackathons |
| **Eventbrite** | scrape `__SERVER_DATA__` | Public search API was removed; we read the page's embedded results |
| **Meetup** | scrape `__NEXT_DATA__` Apollo cache | GraphQL API needs OAuth; we read the embedded cache |
| **Luma** | scrape embedded event JSON | No public API |

Eventbrite/Meetup/Luma return all kinds of events, so a keyword filter (`lib/hackathonFilter.ts`) keeps only hackathon-like ones.

## Adding a source

Create `lib/sources/<name>.ts` exporting a `SourceAdapter` whose `fetch()` returns `RawHackathon[]`, then register it in `lib/sources/index.ts`. The aggregator handles tagging, dedupe, and persistence. Next candidates: an LLM web-search adapter for the long tail (BU/MIT/Harvard club pages, sponsor sites).

## Deploying (swap SQLite → Postgres)

1. `prisma/schema.prisma`: set `provider = "postgresql"`.
2. `lib/db.ts`: swap `PrismaBetterSqlite3` for `@prisma/adapter-pg` (or use Prisma Postgres).
3. Set `DATABASE_URL` to your Postgres connection string.
4. `npx prisma migrate deploy` and deploy.

## Stack

- **Next.js 16** App Router (Server Components, async `searchParams`)
- **Prisma 7** with the better-sqlite3 driver adapter
- **Tailwind CSS v4**
- Sources: **Devpost** (JSON API), **MLH** (embedded season JSON)
