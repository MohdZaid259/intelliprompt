import { describe, expect, it, vi } from "vitest";
import { checkRateLimit, memoryStore, RATE_LIMITS, rateLimitMessage } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit within a window, then refuses with a retry time", async () => {
    const store = memoryStore();
    const now = Date.parse("2026-11-04T10:00:15Z");
    const { limit } = RATE_LIMITS.comment;
    for (let i = 0; i < limit; i++) {
      expect(await checkRateLimit("comment", "u1", store, now)).toEqual({ ok: true });
    }
    expect(await checkRateLimit("comment", "u1", store, now)).toEqual({
      ok: false,
      retryAfterSec: 45,
    });
  });

  it("counts users and actions separately", async () => {
    const store = memoryStore();
    for (let i = 0; i < RATE_LIMITS.comment.limit; i++)
      await checkRateLimit("comment", "u1", store);
    expect((await checkRateLimit("comment", "u2", store)).ok).toBe(true);
    expect((await checkRateLimit("react", "u1", store)).ok).toBe(true);
  });

  it("resets in the next window", async () => {
    const store = memoryStore();
    const t0 = Date.parse("2026-11-04T10:00:00Z");
    for (let i = 0; i <= RATE_LIMITS.comment.limit; i++)
      await checkRateLimit("comment", "u1", store, t0);
    expect((await checkRateLimit("comment", "u1", store, t0 + 60_000)).ok).toBe(true);
  });

  it("fails open when the store is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { hit: async () => Promise.reject(new Error("down")) };
    expect(await checkRateLimit("comment", "u1", broken)).toEqual({ ok: true });
  });

  it("writes a friendly message", () => {
    expect(rateLimitMessage(12)).toBe("You're doing that too fast. Try again in 12s.");
    expect(rateLimitMessage(300)).toBe("You're doing that too often. Try again in 5 minutes.");
  });
});
