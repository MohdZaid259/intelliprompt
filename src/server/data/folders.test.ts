import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import {
  createFolder,
  deleteFolder,
  listFolders,
  MAX_FOLDERS,
  movePrompt,
  renameFolder,
} from "./folders";
import { createPrompt, getOwnedPrompt, listPrompts } from "./prompts";

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

async function folder(owner: string, name: string) {
  const result = await createFolder(db, owner, name);
  if (!result.ok) throw new Error(result.reason);
  return result.value.id;
}

describe("folders", () => {
  it("creates, lists with counts, and rejects duplicate names", async () => {
    const work = await folder(ALICE, "Work");
    await folder(ALICE, "Art");
    await createPrompt(db, ALICE, { title: "A", content: "a", tags: [], folderId: work });
    expect(await createFolder(db, ALICE, "Work")).toEqual({ ok: false, reason: "duplicate" });
    expect(await createFolder(db, BOB, "Work")).toMatchObject({ ok: true });
    expect(await listFolders(db, ALICE)).toMatchObject([
      { name: "Art", promptCount: 0 },
      { name: "Work", promptCount: 1 },
    ]);
  });

  it("caps how many folders a user can have", async () => {
    for (let i = 0; i < MAX_FOLDERS; i++) await folder(ALICE, `F${i}`);
    expect(await createFolder(db, ALICE, "One more")).toEqual({ ok: false, reason: "limit" });
  });

  it("filters prompts by folder or unsorted", async () => {
    const work = await folder(ALICE, "Work");
    const a = await createPrompt(db, ALICE, { title: "A", content: "a", tags: [], folderId: work });
    const b = await createPrompt(db, ALICE, { title: "B", content: "b", tags: [] });
    expect((await listPrompts(db, ALICE, { folder: work })).map((p) => p.id)).toEqual([a.id]);
    expect((await listPrompts(db, ALICE, { folder: null })).map((p) => p.id)).toEqual([b.id]);
    expect(await listPrompts(db, ALICE)).toHaveLength(2);
    expect((await listPrompts(db, ALICE, { folder: work }))[0]).toMatchObject({
      folderName: "Work",
      preview: "a",
      latest: 1,
    });
  });

  it("never files a prompt into someone else's folder", async () => {
    const bobs = await folder(BOB, "Bob's");
    const { id } = await createPrompt(db, ALICE, {
      title: "A",
      content: "a",
      tags: [],
      folderId: bobs,
    });
    expect((await getOwnedPrompt(db, ALICE, id))?.folderId).toBeNull();
    expect(await movePrompt(db, ALICE, id, bobs)).toBeNull();
    expect(await movePrompt(db, BOB, id, bobs)).toBeNull(); // not Bob's prompt
  });

  it("moves prompts in and out of folders", async () => {
    const work = await folder(ALICE, "Work");
    const { id } = await createPrompt(db, ALICE, { title: "A", content: "a", tags: [] });
    expect(await movePrompt(db, ALICE, id, work)).toEqual({ id });
    expect((await getOwnedPrompt(db, ALICE, id))?.folderId).toBe(work);
    expect(await movePrompt(db, ALICE, id, null)).toEqual({ id });
    expect((await getOwnedPrompt(db, ALICE, id))?.folderId).toBeNull();
  });

  it("renames only your own folder and keeps names unique", async () => {
    const work = await folder(ALICE, "Work");
    await folder(ALICE, "Art");
    expect(await renameFolder(db, BOB, work, "Mine")).toBeNull();
    expect(await renameFolder(db, ALICE, work, "Art")).toEqual({ ok: false, reason: "duplicate" });
    expect(await renameFolder(db, ALICE, work, "Work")).toMatchObject({ ok: true }); // same name is fine
    expect(await renameFolder(db, ALICE, work, "Jobs")).toMatchObject({ ok: true });
  });

  it("deleting a folder keeps its prompts", async () => {
    const work = await folder(ALICE, "Work");
    const { id } = await createPrompt(db, ALICE, {
      title: "A",
      content: "a",
      tags: [],
      folderId: work,
    });
    expect(await deleteFolder(db, BOB, work)).toBeNull();
    expect(await deleteFolder(db, ALICE, work)).toEqual({ id: work });
    expect((await getOwnedPrompt(db, ALICE, id))?.folderId).toBeNull();
  });
});
