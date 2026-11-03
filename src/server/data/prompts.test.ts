import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { prompts, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import {
  addVersion,
  createPrompt,
  deletePrompt,
  getOwnedPrompt,
  getRunnableVersion,
  listPrompts,
  restoreVersion,
  updatePromptMeta,
} from "./prompts";
import { deleteRun, insertRun, listRunsForVersions, toggleBestRun } from "./runs";

let db: Db;
const ALICE = "user_alice";
const BOB = "user_bob";

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: ALICE, username: "alice", email: "a@example.com" },
    { id: BOB, username: "bob", email: "b@example.com" },
  ]);
});

const newPrompt = () =>
  createPrompt(db, ALICE, { title: "Summarizer", content: "Summarize: {text}", tags: ["writing"] });

const okRun = (versionId: string, userId = ALICE) =>
  insertRun(db, {
    versionId,
    userId,
    modelId: "test/model",
    temperature: 0.7,
    maxTokens: 1024,
    status: "ok",
    output: "done",
  });

describe("prompts", () => {
  it("creates a prompt with version 1", async () => {
    const { id } = await newPrompt();
    const prompt = await getOwnedPrompt(db, ALICE, id);
    expect(prompt?.title).toBe("Summarizer");
    expect(prompt?.versions.map((v) => v.number)).toEqual([1]);
    expect(await listPrompts(db, ALICE)).toMatchObject([{ id, versionCount: 1 }]);
  });

  it("numbers new versions sequentially and lists newest first", async () => {
    const { id } = await newPrompt();
    await addVersion(db, ALICE, id, { content: "v2" });
    await addVersion(db, ALICE, id, { content: "v3", source: "enhanced", note: "clearer" });
    const prompt = await getOwnedPrompt(db, ALICE, id);
    expect(prompt?.versions.map((v) => [v.number, v.source])).toEqual([
      [3, "enhanced"],
      [2, "manual"],
      [1, "manual"],
    ]);
  });

  it("gives concurrent saves distinct numbers", async () => {
    const { id } = await newPrompt();
    await Promise.all([
      addVersion(db, ALICE, id, { content: "a" }),
      addVersion(db, ALICE, id, { content: "b" }),
    ]);
    const prompt = await getOwnedPrompt(db, ALICE, id);
    expect(prompt?.versions.map((v) => v.number)).toEqual([3, 2, 1]);
  });

  it("restores an old version as a new latest version", async () => {
    const { id } = await newPrompt();
    await addVersion(db, ALICE, id, { content: "changed" });
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions.find((v) => v.number === 1)!;

    const restored = await restoreVersion(db, ALICE, v1.id);
    expect(restored).toMatchObject({ number: 3, content: "Summarize: {text}", source: "restored" });
  });

  it("keeps private prompts away from other users", async () => {
    const { id } = await newPrompt();
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions[0];

    expect(await getOwnedPrompt(db, BOB, id)).toBeNull();
    expect(await listPrompts(db, BOB)).toEqual([]);
    expect(await updatePromptMeta(db, BOB, id, { title: "hacked", tags: [] })).toBeNull();
    expect(await addVersion(db, BOB, id, { content: "hacked" })).toBeNull();
    expect(await restoreVersion(db, BOB, v1.id)).toBeNull();
    expect(await getRunnableVersion(db, BOB, v1.id)).toBeNull();
    expect(await deletePrompt(db, BOB, id)).toBeNull();

    const prompt = await getOwnedPrompt(db, ALICE, id);
    expect(prompt?.title).toBe("Summarizer");
    expect(prompt?.versions).toHaveLength(1);
  });

  it("lets anyone run a version of a public prompt", async () => {
    const { id } = await newPrompt();
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions[0];
    await db.update(prompts).set({ visibility: "public" }).where(eq(prompts.id, id));

    expect(await getRunnableVersion(db, BOB, v1.id)).toMatchObject({ id: v1.id, ownerId: ALICE });
  });
});

describe("runs", () => {
  it("toggles one best run per version", async () => {
    const { id } = await newPrompt();
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions[0];
    const a = await okRun(v1.id);
    const b = await okRun(v1.id);

    await toggleBestRun(db, ALICE, a.id);
    await toggleBestRun(db, ALICE, b.id);
    let list = await listRunsForVersions(db, ALICE, [v1.id]);
    expect(list.filter((r) => r.isBest).map((r) => r.id)).toEqual([b.id]);

    await toggleBestRun(db, ALICE, b.id);
    list = await listRunsForVersions(db, ALICE, [v1.id]);
    expect(list.some((r) => r.isBest)).toBe(false);
  });

  it("does not let other users mark or delete runs", async () => {
    const { id } = await newPrompt();
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions[0];
    const run = await okRun(v1.id);

    expect(await toggleBestRun(db, BOB, run.id)).toBeNull();
    expect(await deleteRun(db, BOB, run.id)).toBeNull();
    expect(await listRunsForVersions(db, BOB, [v1.id])).toEqual([]);
  });

  it("cannot mark a failed run as best", async () => {
    const { id } = await newPrompt();
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions[0];
    const failed = await insertRun(db, {
      versionId: v1.id,
      userId: ALICE,
      modelId: "test/model",
      temperature: 0.7,
      maxTokens: 1024,
      status: "error",
      error: "boom",
    });
    expect(await toggleBestRun(db, ALICE, failed.id)).toBeNull();
  });
});
