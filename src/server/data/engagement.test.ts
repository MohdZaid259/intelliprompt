import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { forkPrompt, publishPrompt } from "./community";
import { getLeaderboard, liveStreak, touchStreak } from "./engagement";
import { createPrompt, getOwnedPrompt } from "./prompts";
import { toggleLike, toggleSave } from "./social";

let db: Db;

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: "a", username: "alice", email: "a@x.com" },
    { id: "b", username: "bob", email: "b@x.com" },
    { id: "c", username: "cara", email: "c@x.com" },
  ]);
});

async function publish(owner: string, title: string) {
  const { id } = await createPrompt(db, owner, { title, content: title, tags: [] });
  const p = (await getOwnedPrompt(db, owner, id))!;
  await publishPrompt(db, owner, id, p.versions[0].id);
  return id;
}

describe("streaks", () => {
  it("counts consecutive days, ignores repeats on the same day, and resets after a gap", async () => {
    expect(await touchStreak(db, "a", "2026-11-01")).toEqual({ current: 1, best: 1 });
    expect(await touchStreak(db, "a", "2026-11-01")).toEqual({ current: 1, best: 1 });
    expect(await touchStreak(db, "a", "2026-11-02")).toEqual({ current: 2, best: 2 });
    expect(await touchStreak(db, "a", "2026-11-03")).toEqual({ current: 3, best: 3 });
    expect(await touchStreak(db, "a", "2026-11-06")).toEqual({ current: 1, best: 3 });
  });

  it("shows a streak as live only if active today or yesterday", () => {
    const user = { streakCurrent: 4, lastActiveDay: "2026-11-02" };
    expect(liveStreak(user, "2026-11-02")).toBe(4);
    expect(liveStreak(user, "2026-11-03")).toBe(4);
    expect(liveStreak(user, "2026-11-04")).toBe(0);
    expect(liveStreak({ streakCurrent: 0, lastActiveDay: null }, "2026-11-04")).toBe(0);
  });
});

describe("leaderboard", () => {
  it("scores likes, saves, forks and publishing from others, not yourself", async () => {
    const alicePrompt = await publish("a", "Alice's");
    await publish("b", "Bob's");
    await toggleLike(db, "b", alicePrompt); // +3
    await toggleLike(db, "c", alicePrompt); // +3
    await toggleSave(db, "c", alicePrompt); // +2
    await forkPrompt(db, "b", alicePrompt); // +5
    await toggleLike(db, "a", alicePrompt); // self-like: 0

    const board = await getLeaderboard(db);
    expect(board.map((r) => [r.username, r.points])).toEqual([
      ["alice", 1 + 3 + 3 + 2 + 5],
      ["bob", 1],
    ]);
  });

  it("only counts recent events for the weekly board", async () => {
    const id = await publish("a", "Old");
    await toggleLike(db, "b", id);
    await db.execute(sql`update likes set created_at = now() - interval '30 days'`);
    await db.execute(sql`update prompts set published_at = now() - interval '30 days'`);
    await toggleLike(db, "c", id);

    const week = await getLeaderboard(db, { since: new Date(Date.now() - 7 * 86_400_000) });
    expect(week).toMatchObject([{ username: "alice", points: 3 }]);
  });

  it("ignores private prompts", async () => {
    const id = await publish("a", "Was public");
    await toggleLike(db, "b", id);
    await db.execute(sql`update prompts set visibility = 'private'`);
    expect(await getLeaderboard(db)).toEqual([]);
    expect((await db.select().from(users).where(eq(users.id, "a")))[0].username).toBe("alice");
  });
});
