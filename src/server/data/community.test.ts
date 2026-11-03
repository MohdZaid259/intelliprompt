import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { likes, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import {
  forkPrompt,
  getPublicPrompt,
  getViewerFlags,
  listPublicPrompts,
  publishPrompt,
  unpublishPrompt,
} from "./community";
import { addVersion, createPrompt, getOwnedPrompt } from "./prompts";
import { deleteRun, insertRun, toggleBestRun } from "./runs";
import {
  addComment,
  deleteComment,
  getProfile,
  listComments,
  recordShare,
  toggleCommentLike,
  toggleFollow,
  toggleLike,
  toggleSave,
} from "./social";

let db: Db;
const ALICE = "user_alice";
const BOB = "user_bob";
const CARA = "user_cara";

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: ALICE, username: "alice", name: "Alice", email: "alice@secret.com" },
    { id: BOB, username: "bob", email: "bob@secret.com" },
    { id: CARA, username: "cara", email: "cara@secret.com" },
  ]);
});

/** Creates a prompt for `owner` and publishes its latest version. */
async function published(owner = ALICE, title = "Summarizer", tags = ["writing"]) {
  const { id } = await createPrompt(db, owner, { title, content: `${title} v1`, tags });
  const prompt = (await getOwnedPrompt(db, owner, id))!;
  await publishPrompt(db, owner, id, prompt.versions[0].id);
  return { id, versionId: prompt.versions[0].id };
}

describe("publishing", () => {
  it("only lists public prompts, showing the published version", async () => {
    const { id } = await published();
    await createPrompt(db, ALICE, { title: "Private", content: "secret", tags: [] });
    await addVersion(db, ALICE, id, { content: "unpublished draft" });

    const feed = await listPublicPrompts(db);
    expect(feed.map((p) => p.title)).toEqual(["Summarizer"]);
    expect(feed[0]).toMatchObject({ versionNumber: 1, preview: "Summarizer v1" });
    expect(feed[0].author).toEqual({
      id: ALICE,
      username: "alice",
      name: "Alice",
      avatarUrl: "",
    });

    await unpublishPrompt(db, ALICE, id);
    expect(await listPublicPrompts(db)).toEqual([]);
    expect(await getPublicPrompt(db, id)).toBeNull();
  });

  it("refuses to publish someone else's prompt or a foreign version", async () => {
    const { id, versionId } = await published();
    const other = await createPrompt(db, BOB, { title: "Bob's", content: "x", tags: [] });
    expect(await publishPrompt(db, BOB, id, versionId)).toBeNull();
    expect(await publishPrompt(db, BOB, other.id, versionId)).toBeNull();
    expect(await unpublishPrompt(db, BOB, id)).toBeNull();
  });

  it("shows the owner's best answer on the public page", async () => {
    const { id, versionId } = await published();
    const run = await insertRun(db, {
      versionId,
      userId: ALICE,
      modelId: "test/model",
      temperature: 0.7,
      maxTokens: 512,
      status: "ok",
      output: "Great answer",
    });
    await toggleBestRun(db, ALICE, run.id);
    const page = await getPublicPrompt(db, id);
    expect(page?.bestRun?.output).toBe("Great answer");
    expect(page?.content).toBe("Summarizer v1");
  });
});

describe("feed counts and sorting", () => {
  it("counts likes, saves, shares, comments and forks", async () => {
    const { id } = await published();
    await toggleLike(db, BOB, id);
    await toggleLike(db, CARA, id);
    await toggleSave(db, BOB, id);
    await recordShare(db, BOB, id, "link");
    await recordShare(db, BOB, id, "x");
    await addComment(db, CARA, id, "Nice");
    await forkPrompt(db, BOB, id);
    await forkPrompt(db, BOB, id); // same person forking twice counts once

    const [item] = await listPublicPrompts(db);
    expect(item).toMatchObject({ likes: 2, saves: 1, shares: 2, comments: 1, forks: 1 });
  });

  it("sorts top by likes this week", async () => {
    const a = await published(ALICE, "Old favourite");
    const b = await published(BOB, "Hot this week");
    await toggleLike(db, BOB, a.id);
    await toggleLike(db, CARA, a.id);
    await db.execute(sql`update likes set created_at = now() - interval '30 days'`);
    await toggleLike(db, ALICE, b.id);

    const top = await listPublicPrompts(db, { sort: "top" });
    expect(top.map((p) => p.title)).toEqual(["Hot this week", "Old favourite"]);
  });

  it("filters by following, saved, author and tag", async () => {
    const a = await published(ALICE, "Alice prompt", ["writing"]);
    await published(BOB, "Bob prompt", ["code"]);
    await toggleFollow(db, CARA, ALICE);
    await toggleSave(db, CARA, a.id);

    const titles = async (o: Parameters<typeof listPublicPrompts>[1]) =>
      (await listPublicPrompts(db, o)).map((p) => p.title);
    expect(await titles({ followingOf: CARA })).toEqual(["Alice prompt"]);
    expect(await titles({ savedBy: CARA })).toEqual(["Alice prompt"]);
    expect(await titles({ authorId: BOB })).toEqual(["Bob prompt"]);
    expect(await titles({ tag: "code" })).toEqual(["Bob prompt"]);
  });

  it("reports which prompts the viewer liked and saved", async () => {
    const { id } = await published();
    await toggleLike(db, BOB, id);
    const flags = await getViewerFlags(db, BOB, [id]);
    expect(flags.liked.has(id)).toBe(true);
    expect(flags.saved.has(id)).toBe(false);
  });
});

describe("social actions", () => {
  it("toggles likes and saves on and off", async () => {
    const { id } = await published();
    expect(await toggleLike(db, BOB, id)).toEqual({ active: true, count: 1 });
    expect(await toggleLike(db, BOB, id)).toEqual({ active: false, count: 0 });
    expect(await toggleSave(db, BOB, id)).toEqual({ active: true, count: 1 });
  });

  it("rejects engagement on private prompts", async () => {
    const { id } = await createPrompt(db, ALICE, { title: "Private", content: "x", tags: [] });
    expect(await toggleLike(db, BOB, id)).toBeNull();
    expect(await toggleSave(db, BOB, id)).toBeNull();
    expect(await recordShare(db, BOB, id, "link")).toBeNull();
    expect(await addComment(db, BOB, id, "hi")).toBeNull();
    expect(await forkPrompt(db, BOB, id)).toBeNull();
    expect(await db.select().from(likes)).toEqual([]);
  });

  it("lets the author or the prompt owner delete a comment, nobody else", async () => {
    const { id } = await published();
    const c1 = (await addComment(db, BOB, id, "from bob"))!;
    const c2 = (await addComment(db, BOB, id, "also bob"))!;

    expect(await deleteComment(db, CARA, c1.id)).toBeNull();
    expect(await deleteComment(db, BOB, c1.id)).not.toBeNull();
    expect(await deleteComment(db, ALICE, c2.id)).not.toBeNull();
    expect(await listComments(db, id, null)).toEqual([]);
  });

  it("counts comment likes and marks the viewer's", async () => {
    const { id } = await published();
    const c = (await addComment(db, BOB, id, "hello"))!;
    await toggleCommentLike(db, ALICE, c.id);
    await toggleCommentLike(db, CARA, c.id);

    const [comment] = await listComments(db, id, ALICE);
    expect(comment).toMatchObject({ body: "hello", likes: 2, likedByViewer: true });
    expect(comment.author.username).toBe("bob");
    expect(comment.author).not.toHaveProperty("email");
  });

  it("follows, unfollows, and refuses self-follows", async () => {
    expect(await toggleFollow(db, BOB, ALICE)).toEqual({ active: true, count: 1 });
    expect(await toggleFollow(db, BOB, ALICE)).toEqual({ active: false, count: 0 });
    expect(await toggleFollow(db, BOB, BOB)).toBeNull();
    expect(await toggleFollow(db, BOB, "user_missing")).toBeNull();
  });

  it("builds a profile without private fields", async () => {
    const { id } = await published();
    await toggleLike(db, BOB, id);
    await toggleFollow(db, BOB, ALICE);

    const profile = await getProfile(db, "alice", BOB);
    expect(profile).toMatchObject({
      username: "alice",
      followers: 1,
      following: 0,
      published: 1,
      likesReceived: 1,
      isFollowing: true,
      isSelf: false,
    });
    expect(profile).not.toHaveProperty("email");
    expect(await getProfile(db, "nobody", null)).toBeNull();
  });
});

describe("forking", () => {
  it("copies the published version into the forker's prompts and links back", async () => {
    const { id } = await published();
    await addVersion(db, ALICE, id, { content: "unpublished draft" });

    const fork = (await forkPrompt(db, BOB, id))!;
    const copy = (await getOwnedPrompt(db, BOB, fork.id))!;
    expect(copy.versions).toMatchObject([
      { number: 1, content: "Summarizer v1", source: "fork", note: "Forked from @alice" },
    ]);
    expect(copy.forkedFromId).toBe(id);

    const forkVersion = copy.versions[0].id;
    await publishPrompt(db, BOB, fork.id, forkVersion);
    expect((await getPublicPrompt(db, fork.id))?.forkedFrom).toMatchObject({
      id,
      username: "alice",
    });
  });
});

describe("runs on public prompts", () => {
  it("lets visitors delete only their own runs, and never be marked best", async () => {
    const { versionId } = await published();
    const visitorRun = await insertRun(db, {
      versionId,
      userId: BOB,
      modelId: "test/model",
      temperature: 0.7,
      maxTokens: 512,
      status: "ok",
      output: "bob's try",
    });

    expect(await toggleBestRun(db, ALICE, visitorRun.id)).toBeNull();
    expect(await deleteRun(db, ALICE, visitorRun.id)).toBeNull();
    expect(await deleteRun(db, BOB, visitorRun.id)).not.toBeNull();
  });
});

describe("first publish", () => {
  it("is reported only the first time a prompt goes public", async () => {
    const { id } = await createPrompt(db, ALICE, { title: "T", content: "c", tags: [] });
    const v1 = (await getOwnedPrompt(db, ALICE, id))!.versions[0].id;
    expect(await publishPrompt(db, ALICE, id, v1)).toEqual({ id, firstPublish: true });
    await unpublishPrompt(db, ALICE, id);
    expect(await publishPrompt(db, ALICE, id, v1)).toEqual({ id, firstPublish: false });
  });
});
