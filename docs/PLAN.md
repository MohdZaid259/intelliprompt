# IntelliPrompt v2 — Revamp Plan (MVP)

> Status: plan agreed 2026-11-03; MVP built 2026-11-07
> Decisions locked: Postgres + Drizzle · fresh rebuild (reuse UI) · one paid OpenRouter key + daily quota · Pro plan in MVP · no direct messages · MVP also includes leaderboard, streaks, blog, newsletter, BullMQ email queue + worker, saves/shares, comment likes

> Progress: Milestones 0–5 are done, plus the v1-style app shell (sidebar, folders, dashboard, library). Live at https://intelliprompt.vercel.app (Vercel + Neon + Railway, Razorpay in test mode).

---

## 1. Product

**One loop:** write a prompt → enhance it → run it on several models side by side → keep the best version → publish it so others can like, comment, and fork it.

Anything that doesn't serve this loop is out of the MVP.

### In scope

| Area         | What ships                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor       | Write/edit prompt, title, tags, private/public                                                                                                    |
| Enhancer     | Returns improved prompt + short "what changed" list; "Accept" saves it as a new version                                                           |
| Compare      | Pick 2–4 models (multiple from the same provider allowed), set temperature/max tokens, responses stream side by side with latency + tokens + cost |
| Versions     | Immutable versions, diff between any two, restore (= new version from old content), mark a best run per version                                   |
| Publish      | Public prompt page shows best version + best response; shareable link with OG image                                                               |
| Community    | Explore (new / top this week), Following feed, likes, comments, follow, profile page, **Fork** ("Use this prompt")                                |
| Plans        | Free (daily limits, standard models) and Pro (higher limits, premium models), paid via Razorpay                                                   |
| Engagement   | Saves (bookmark others' prompts), share counter, comment likes                                                                                    |
| Gamification | Daily streak (any run/enhance/publish counts), leaderboard (overall + trending this week)                                                         |
| Content      | Blog (MDX files in repo, no CMS)                                                                                                                  |
| Email        | Newsletter opt-in, "new post from someone you follow" emails, admin-only announcements — via BullMQ queue + separate email worker + Resend        |

### Out of MVP

Direct messages · BYOK (later) · teams.

Coming soon (shown in the UI with a chip): favorite prompts and versions · Perplexity · profile social links.

---

## 2. Stack

| Concern    | Choice                                                  | Why                                                                                              |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| App        | Next.js (App Router) + TypeScript strict                | Same as before, server actions replace most API routes                                           |
| UI         | Tailwind + shadcn/ui (ported from v1)                   | Already built, looks good                                                                        |
| Auth       | Clerk                                                   | Works, webhook syncs users                                                                       |
| DB         | Postgres (Neon) + Drizzle ORM + drizzle-kit migrations  | Relational data, unique constraints, real joins/counts                                           |
| AI         | Vercel AI SDK + `@openrouter/ai-sdk-provider`           | Streaming, retries, one code path                                                                |
| Rate limit | Upstash Redis + `@upstash/ratelimit`                    | Burst protection only; quotas live in Postgres                                                   |
| Queue      | BullMQ on Redis (Upstash TCP URL)                       | Email fan-out off the request path                                                               |
| Email      | Resend + react-email templates                          | Already used in v1                                                                               |
| Worker     | `worker/email.ts` run as its own process                | Vercel can't host long-running workers → deploy on Railway/Render/Fly (small always-on instance) |
| Blog       | MDX in `content/blog/`                                  | No CMS to run                                                                                    |
| Payments   | Razorpay (one-time 30-day / 365-day passes)             | No recurring-subscription webhooks to manage in MVP                                              |
| Validation | zod                                                     | Every server action input                                                                        |
| Tests      | Vitest (unit/data layer) + Playwright (2–3 smoke flows) | Small but meaningful                                                                             |
| Hosting    | Vercel + Neon + Upstash                                 | Free/cheap tiers, zero ops                                                                       |

Removed vs v1: MongoDB/Mongoose, antd, axios, PM2 config.

---

## 3. Project structure

```
src/
  app/
    (marketing)/page.tsx            landing + pricing
    (app)/
      prompts/                      my prompts list
      prompts/new/  saved/  leaderboard/  blog/[slug]/
      prompts/[id]/                 editor + versions + compare (tabs)
      explore/                      new / top / following
      p/[id]/                       public prompt page
      u/[username]/                 profile
      settings/  billing/
    api/
      run/route.ts                  streaming model run (only streaming endpoint)
      webhooks/clerk/route.ts
      webhooks/razorpay/route.ts
  server/
    db/schema.ts  db/index.ts       Drizzle schema + client
    auth.ts                         requireUser() / optionalUser()
    data/                           data-access layer: prompts.ts, versions.ts, runs.ts, social.ts, billing.ts
    actions/                        thin server actions: zod-parse → requireUser → data layer
    ai/
      models.ts                     curated registry (id, label, provider, tier, active)
      client.ts                     OpenRouter provider, fallbacks, retries
      enhance.ts  run.ts
    quota.ts  ratelimit.ts
  components/                       ported shadcn + feature components
  config/plans.ts                   single source of truth for plans, prices, limits
  server/email/queue.ts             BullMQ queue + enqueue helpers (used by actions)
  emails/                           react-email templates
content/blog/*.mdx
worker/email.ts                     BullMQ worker process (separate deploy)
```

**Rule:** UI → server action → data layer → DB. Only the data layer touches the DB, and every function takes the `userId`, so ownership is checked in one place.

---

## 4. Data model (Postgres)

```
users        id (clerk id, pk) · username (unique) · name · avatar_url · bio · email (private)
             plan ('free'|'pro') · plan_expires_at · role ('user'|'admin') · newsletter bool
             streak_current · streak_best · last_active_day (date) · created_at

folders      id · owner_id → users · name (unique per owner, 1..60) · created_at   (max 50 per user)

prompts      id · owner_id → users · folder_id → folders (nullable, set null on delete)
             title · tags text[] · visibility ('private'|'public')
             best_version_id → versions (nullable) · forked_from_id → prompts (nullable)
             published_at · created_at · updated_at
             idx: (owner_id), (visibility, published_at), gin(tags)

versions     id · prompt_id → prompts (cascade) · number · content · note · source ('manual'|'enhanced'|'restored'|'fork')
             created_at · unique(prompt_id, number)          -- immutable, never updated

runs         id · version_id → versions (cascade) · user_id · model_id · temperature · max_tokens
             output · status ('ok'|'error') · error · input_tokens · output_tokens · cost_usd · latency_ms
             is_best bool · created_at

likes        user_id · prompt_id · created_at · pk(user_id, prompt_id)
saves        user_id · prompt_id · created_at · pk(user_id, prompt_id)
shares       id · prompt_id · user_id (nullable) · channel · created_at   -- counted, not unique
comments     id · prompt_id (cascade) · user_id · body (≤ 1000) · created_at
comment_likes user_id · comment_id (cascade) · pk(user_id, comment_id)
follows      follower_id · followee_id · created_at · pk(follower_id, followee_id) · check(follower_id <> followee_id)

usage_daily  user_id · day (date) · runs int · enhances int · cost_usd · pk(user_id, day)
payments     id · user_id · razorpay_order_id (unique) · razorpay_payment_id (unique, nullable)
             plan_key · amount_paise · currency · status ('created'|'paid'|'failed') · created_at
```

- Counts (likes, comments, followers) come from `COUNT` queries. Denormalize later only if needed.
- **Streak:** updated in the same transaction as a run/enhance/publish: same day → no-op; yesterday → +1; older → reset to 1.
- **Leaderboard:** one SQL query that scores users from likes, saves, and forks received plus prompts published (weights in config), cached in Redis for 10 min. Has two views: overall, and trending over the last 7 days.
- **Emails:** publishing a public prompt enqueues one `notify-followers` job. The worker pages through followers who have opted in and sends in batches. Announcements are an admin-only action (role checked on the server).
- Deleting a prompt cascades to its versions, runs, likes, and comments.

---

## 5. AI layer

**Model registry (`ai/models.ts`)** — a short curated list (~8–12 models) with `tier: 'free' | 'pro'`. A daily cached check against `GET openrouter.ai/api/v1/models` marks any retired model inactive, so the UI hides it instead of failing (the v1 problem).

**Calls:**

- Use one paid OpenRouter key with a monthly spend cap set in the OpenRouter dashboard.
- Each run passes a `models` fallback list (the primary model plus one equivalent), so OpenRouter falls through automatically when a provider is down.
- Retry with backoff on 429/5xx (2 attempts).
- Optional `OPENROUTER_API_KEYS` pool, used for failover only (revoked or exhausted key): owned keys, not free-tier multiplication.
- Usage accounting is on, so token counts and cost come back with each run and are stored.

**Run flow (`/api/run`):**

1. requireUser
2. rate limit
3. check the quota and reserve it
4. check that the version belongs to the user, or is public
5. check that the model is active and the plan allows its tier
6. stream from all models in parallel (one stream per model, multiplexed)
7. on finish, insert the run rows and settle usage

**Enhancer:** one `generateObject` call returning `{ prompt, changes: string[] }`. The UI shows a diff, and "Accept" creates a version with `source='enhanced'`.

**Defaults:** temperature 0.7, max_tokens 1024 (Pro up to 4096).

---

## 6. Plans, quota and payments

`config/plans.ts` is the single source of truth for both the UI and the server.

|                | Free      | Pro (draft)                                      |
| -------------- | --------- | ------------------------------------------------ |
| Model runs/day | 20        | 300                                              |
| Enhances/day   | 5         | 100                                              |
| Models         | free tier | all                                              |
| Max tokens     | 1024      | 4096                                             |
| Price          | ₹0        | ₹499 / 30 days · ₹4,999 / 365 days _(to decide)_ |

**Payment flow (fixes every v1 hole):**

1. Server action `createOrder(planKey)`: the price comes from config, never from the client. It creates the Razorpay order (amount in **paise**) and inserts a `payments` row (`created`).
2. Client checkout opens Razorpay.
3. `verifyPayment` (action): verify the HMAC signature, look up the `payments` row by order id (this binds the plan), and check that `payment_id` was not used before (unique constraint). Mark it paid and extend `plan_expires_at` in one transaction.
4. The Razorpay webhook `payment.captured` runs the same idempotent function, as a backup in case the browser closes.

**Quota:** atomic `INSERT … ON CONFLICT DO UPDATE … WHERE runs + n <= limit RETURNING`. If no row comes back, the user is over the limit. This is race-free with no extra service.

---

## 7. Security checklist (acceptance criteria)

- [ ] Every action/route: zod input → `requireUser` → data layer with owner check
- [ ] Private prompts/versions/runs are never readable by others (tested)
- [ ] Public API never returns email or plan
- [ ] Prices and plans derived on the server only. Payments are idempotent, and signatures verified.
- [ ] Clerk and Razorpay webhooks verify their signatures
- [ ] Rate limit on run, enhance, comment, follow, like
- [ ] Admin-only actions (announcements) check `role='admin'` on the server
- [ ] Every email has an unsubscribe link, and newsletter is opt-in only
- [ ] Secrets only in env, `.env.example` complete, `.env*` git-ignored
- [ ] Comments rendered as plain text, model output as sanitized markdown

---

## 8. Milestones

| #   | Milestone  | Done when                                                                                                                                                   |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Foundation | git repo, Next app, Drizzle schema + first migration, Clerk + webhook, port UI kit, CI (typecheck, lint, test)                                              |
| 1   | Core loop  | create prompt → versions → diff/restore → enhancer → compare runs streaming → mark best                                                                     |
| 2   | Community  | publish, public page + OG image, explore (new/top/following), likes, saves, shares, comments + comment likes, follows, profile, fork                        |
| 3   | Engagement | streaks, leaderboard, blog (MDX), email queue + worker, follower notifications, newsletter opt-in, admin announcements                                      |
| 3b  | Plans      | plans config, quota, Razorpay order/verify/webhook, billing page, model tier gating                                                                         |
| 4   | Hardening  | access-control tests, rate limits, empty/error/loading states, mobile, Playwright smoke tests                                                               |
| 5   | Launch     | Vercel + Neon + Upstash prod, email worker on Railway/Render, Resend domain verified, Razorpay live keys, landing/pricing, seed 20–30 strong public prompts |

---

## 9. Open questions

1. Final Pro pricing: is ₹499/30 days and ₹4,999/365 days right?
2. Which 8–12 models to launch with (free vs pro split)?
3. Name/domain: keep "IntelliPrompt"?
4. Where the v2 project lives: proposed sibling folder `D:\intelliprompt` with its own git repo.
