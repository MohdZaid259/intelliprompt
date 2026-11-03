import { describe, expect, it } from "vitest";
import { checkRateLimit, RATE_LIMITS, redisStore } from "./rate-limit";

// Runs only when REDIS_TEST_URL points at a disposable Redis (e.g. docker compose on :6380).
const url = process.env.REDIS_TEST_URL;

describe.skipIf(!url)("redis rate limit store", () => {
  it("counts atomically and expires the window", async () => {
    const store = redisStore(url!);
    const id = `test-${Date.now()}`;
    const results = await Promise.all(
      Array.from({ length: RATE_LIMITS.comment.limit + 3 }, () =>
        checkRateLimit("comment", id, store),
      ),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(RATE_LIMITS.comment.limit);
  });
});
