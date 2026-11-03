import "server-only";
import Redis from "ioredis";

// Burst protection per user and action. Daily quotas (src/server/quota.ts) are the hard cap
// on AI cost; these limits stop spam and runaway scripts.
export const RATE_LIMITS = {
  write: { limit: 60, windowSec: 60 },
  react: { limit: 120, windowSec: 60 },
  comment: { limit: 10, windowSec: 60 },
  follow: { limit: 30, windowSec: 60 },
  share: { limit: 30, windowSec: 60 },
  enhance: { limit: 10, windowSec: 60 },
  run: { limit: 30, windowSec: 60 },
  publish: { limit: 20, windowSec: 60 },
  fork: { limit: 20, windowSec: 60 },
  order: { limit: 10, windowSec: 600 },
  announce: { limit: 5, windowSec: 3600 },
  // follower emails per author per day; publishing still works beyond this, just silently
  notifyFollowers: { limit: 3, windowSec: 86_400 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

/** Increments a counter that expires after the window and returns the new count. */
export type CounterStore = { hit(key: string, windowSec: number): Promise<number> };

export function memoryStore(): CounterStore {
  const counters = new Map<string, { count: number; expires: number }>();
  return {
    async hit(key, windowSec) {
      const now = Date.now();
      // drop expired windows now and then so a long-running process doesn't grow forever
      if (counters.size > 10_000) {
        for (const [k, v] of counters) if (v.expires <= now) counters.delete(k);
      }
      const entry = counters.get(key);
      if (!entry || entry.expires <= now) {
        counters.set(key, { count: 1, expires: now + windowSec * 1000 });
        return 1;
      }
      entry.count += 1;
      return entry.count;
    },
  };
}

export function redisStore(url: string): CounterStore {
  // Commands queue until the connection is up (cold starts), but give up quickly if Redis is down.
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    commandTimeout: 1000,
  });
  redis.on("error", (err) => console.error("[rate-limit] redis error:", err.message));
  return {
    async hit(key, windowSec) {
      // SET NX EX starts the window with its expiry (works on every Redis version), INCR counts
      const results = await redis.multi().set(key, 0, "EX", windowSec, "NX").incr(key).exec();
      const [error, count] = results?.[1] ?? [new Error("rate-limit transaction aborted"), 0];
      if (error) throw error;
      return count as number;
    },
  };
}

const globalForLimit = globalThis as unknown as { rateLimitStore?: CounterStore };

function defaultStore(): CounterStore {
  globalForLimit.rateLimitStore ??= process.env.REDIS_URL
    ? redisStore(process.env.REDIS_URL)
    : memoryStore(); // dev without Redis: per-process limits
  return globalForLimit.rateLimitStore;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export async function checkRateLimit(
  name: RateLimitName,
  id: string,
  store: CounterStore = defaultStore(),
  now = Date.now(),
): Promise<RateLimitResult> {
  const { limit, windowSec } = RATE_LIMITS[name];
  const window = Math.floor(now / 1000 / windowSec);
  try {
    const count = await store.hit(`rl:${name}:${id}:${window}`, windowSec);
    if (count <= limit) return { ok: true };
    return { ok: false, retryAfterSec: (window + 1) * windowSec - Math.floor(now / 1000) };
  } catch (err) {
    // fail open: a Redis hiccup shouldn't take the app down
    console.error("[rate-limit] check failed:", err);
    return { ok: true };
  }
}

export function rateLimitMessage(retryAfterSec: number) {
  return retryAfterSec > 90
    ? `You're doing that too often. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.`
    : `You're doing that too fast. Try again in ${retryAfterSec}s.`;
}
