# IntelliPrompt

Enhance a prompt, run it on several models side by side, keep the best version, and share it with the community.

See [docs/PLAN.md](docs/PLAN.md) for the product scope, architecture and milestones.

## Stack

Next.js 16 (App Router, server actions) · Postgres + Drizzle · Clerk · Tailwind + shadcn/ui · Vitest

## Getting started

Requires Node 22.13+ and Docker (for local Postgres).

```bash
npm install
cp .env.example .env.local   # then fill in the Clerk keys
docker compose up -d         # local Postgres on :5432
npm run db:migrate
npm run dev
```

Clerk user sync: the app creates a user's row on first sign-in, so the webhook is optional locally. To receive webhooks locally, expose `/api/webhooks/clerk` with a tunnel (e.g. ngrok) and add it in the Clerk dashboard.

## Scripts

| Script                                | What it does                                               |
| ------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                         | Dev server                                                 |
| `npm run typecheck` / `lint` / `test` | Checks (all run in CI)                                     |
| `npm run db:generate`                 | Create a migration after editing `src/server/db/schema.ts` |
| `npm run db:migrate`                  | Apply migrations to `DATABASE_URL`                         |
| `npm run db:studio`                   | Browse the database                                        |

## Code layout

```
src/app/          routes (pages, the few API routes)
src/server/       server-only code: auth, db schema/client, data-access layer
src/components/   UI (shadcn kit in components/ui)
src/lib/          shared pure helpers
drizzle/          generated SQL migrations (commit these)
```

Rule: UI → server action → `src/server/data/*` → DB. Only the data layer touches the database, and every call that reads private data takes the user id, so ownership is checked in one place.

Tests run against an in-memory Postgres (PGlite) with the real migrations, so no database is needed for `npm test`.
