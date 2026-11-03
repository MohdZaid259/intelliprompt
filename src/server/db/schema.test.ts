import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "./test-db";
import { comments, follows, likes, prompts, runs, users, versions } from "./schema";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

let db: TestDb;

async function seed() {
  await db.insert(users).values([
    { id: "user_a", username: "alice", email: "a@example.com" },
    { id: "user_b", username: "bob", email: "b@example.com" },
  ]);
  const [prompt] = await db
    .insert(prompts)
    .values({ ownerId: "user_a", title: "Summarize", tags: ["writing"] })
    .returning();
  const [version] = await db
    .insert(versions)
    .values({ promptId: prompt.id, number: 1, content: "Summarize this" })
    .returning();
  return { prompt, version };
}

const run = (versionId: string, isBest = false) => ({
  versionId,
  userId: "user_a",
  modelId: "test/model",
  temperature: 0.7,
  maxTokens: 1024,
  status: "ok" as const,
  isBest,
});

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users, prompts, versions, runs cascade`);
});

describe("schema constraints", () => {
  it("rejects following yourself", async () => {
    await seed();
    await expect(
      db.insert(follows).values({ followerId: "user_a", followeeId: "user_a" }),
    ).rejects.toThrow();
  });

  it("rejects duplicate follows and likes", async () => {
    const { prompt } = await seed();
    await db.insert(follows).values({ followerId: "user_a", followeeId: "user_b" });
    await expect(
      db.insert(follows).values({ followerId: "user_a", followeeId: "user_b" }),
    ).rejects.toThrow();

    await db.insert(likes).values({ userId: "user_b", promptId: prompt.id });
    await expect(
      db.insert(likes).values({ userId: "user_b", promptId: prompt.id }),
    ).rejects.toThrow();
  });

  it("rejects duplicate version numbers for one prompt", async () => {
    const { prompt } = await seed();
    await expect(
      db.insert(versions).values({ promptId: prompt.id, number: 1, content: "dup" }),
    ).rejects.toThrow();
  });

  it("allows only one best run per version", async () => {
    const { version } = await seed();
    await db.insert(runs).values([run(version.id, true), run(version.id), run(version.id)]);
    await expect(db.insert(runs).values(run(version.id, true))).rejects.toThrow();
  });

  it("rejects empty and over-long comments", async () => {
    const { prompt } = await seed();
    const comment = { promptId: prompt.id, userId: "user_b" };
    await expect(db.insert(comments).values({ ...comment, body: "" })).rejects.toThrow();
    await expect(
      db.insert(comments).values({ ...comment, body: "x".repeat(1001) }),
    ).rejects.toThrow();
    await db.insert(comments).values({ ...comment, body: "Nice prompt" });
  });

  it("deleting a prompt removes its versions, runs, likes and comments", async () => {
    const { prompt, version } = await seed();
    await db.insert(runs).values(run(version.id));
    await db.insert(likes).values({ userId: "user_b", promptId: prompt.id });
    await db.insert(comments).values({ promptId: prompt.id, userId: "user_b", body: "hi" });

    await db.delete(prompts).where(eq(prompts.id, prompt.id));

    expect(await db.select().from(versions)).toHaveLength(0);
    expect(await db.select().from(runs)).toHaveLength(0);
    expect(await db.select().from(likes)).toHaveLength(0);
    expect(await db.select().from(comments)).toHaveLength(0);
  });
});
