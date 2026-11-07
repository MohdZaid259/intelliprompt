import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { publishPrompt } from "./community";
import { getDashboardStats } from "./dashboard";
import { touchStreak } from "./engagement";
import { createPrompt, getOwnedPrompt } from "./prompts";
import { insertRun } from "./runs";
import { toggleLike, toggleSave } from "./social";
import { today } from "@/server/quota";

let db: Db;

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: "a", username: "alice", email: "a@x.com" },
    { id: "b", username: "bob", email: "b@x.com" },
  ]);
});

describe("dashboard stats", () => {
  it("counts prompts, public ones, others' likes and saves, and runs", async () => {
    const { id } = await createPrompt(db, "a", { title: "P", content: "p", tags: [] });
    await createPrompt(db, "a", { title: "Q", content: "q", tags: [] });
    const version = (await getOwnedPrompt(db, "a", id))!.versions[0];
    await publishPrompt(db, "a", id, version.id);

    await toggleLike(db, "b", id);
    await toggleLike(db, "a", id); // own like doesn't count
    await toggleSave(db, "b", id);
    await insertRun(db, {
      versionId: version.id,
      userId: "a",
      modelId: "m",
      temperature: 0.7,
      maxTokens: 1024,
      status: "ok",
      output: "x",
    });
    await touchStreak(db, "a", today());

    expect(await getDashboardStats(db, "a")).toEqual({
      streak: 1,
      bestStreak: 1,
      prompts: 2,
      published: 1,
      likes: 1,
      likesThisWeek: 1,
      saves: 1,
      runs: 1,
    });
  });

  it("is all zeros for a new user", async () => {
    expect(await getDashboardStats(db, "b")).toMatchObject({ prompts: 0, likes: 0, streak: 0 });
  });
});
