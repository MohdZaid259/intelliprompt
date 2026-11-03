import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { prompts, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { publishPrompt } from "@/server/data/community";
import { createPrompt, getOwnedPrompt } from "@/server/data/prompts";
import { toggleFollow } from "@/server/data/social";
import { BATCH_SIZE, notifyFollowers, sendAnnouncement, type OutgoingEmail } from "./jobs";
import { announcementEmail, newPromptEmail } from "./templates";
import { unsubscribeUrl, verifyUnsubscribe } from "./unsubscribe";

const SECRET = "test-secret";
let db: Db;
let sent: { key: string; emails: OutgoingEmail[] }[];
const deps = () => ({
  db,
  appUrl: "https://app.test",
  secret: SECRET,
  send: async (emails: OutgoingEmail[], key: string) => void sent.push({ key, emails }),
});

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  sent = [];
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: "author", username: "author", name: "Ada", email: "ada@x.com" },
    { id: "f1", username: "f1", email: "f1@x.com" },
    { id: "f2", username: "f2", email: "f2@x.com", followUpdates: false },
    { id: "n1", username: "n1", email: "n1@x.com", newsletter: true },
  ]);
});

async function publishedPrompt() {
  const { id } = await createPrompt(db, "author", {
    title: "Cold <email>",
    content: "Write a cold email",
    tags: [],
  });
  const p = (await getOwnedPrompt(db, "author", id))!;
  await publishPrompt(db, "author", id, p.versions[0].id);
  return id;
}

describe("templates", () => {
  it("escapes user content", () => {
    const email = newPromptEmail({
      authorName: "<b>Eve</b>",
      title: `"><script>`,
      preview: "<img src=x>",
      url: "https://app.test/p/1",
      unsubscribeUrl: "https://app.test/unsubscribe?x",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x>");
    expect(email.html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
    expect(email.text).toContain("Unsubscribe: https://app.test/unsubscribe?x");
  });

  it("turns blank lines into paragraphs in announcements", () => {
    const email = announcementEmail({ subject: "News", body: "One\n\nTwo", unsubscribeUrl: "u" });
    expect(email.html.match(/<p style="margin:0 0 16px/g)).toHaveLength(2);
  });
});

describe("unsubscribe links", () => {
  it("verify only with the right signature and list", () => {
    const url = new URL(unsubscribeUrl("https://app.test", SECRET, "f1", "follows"));
    const params = Object.fromEntries(url.searchParams);
    expect(verifyUnsubscribe(SECRET, params)).toEqual({ userId: "f1", list: "follows" });
    expect(verifyUnsubscribe(SECRET, { ...params, u: "n1" })).toBeNull();
    expect(verifyUnsubscribe(SECRET, { ...params, l: "newsletter" })).toBeNull();
    expect(verifyUnsubscribe("other-secret", params)).toBeNull();
    expect(verifyUnsubscribe(SECRET, { u: "f1", l: "follows", t: "short" })).toBeNull();
  });
});

describe("notifyFollowers", () => {
  it("emails followers who want updates, with their own unsubscribe link", async () => {
    const id = await publishedPrompt();
    await toggleFollow(db, "f1", "author");
    await toggleFollow(db, "f2", "author"); // opted out
    await toggleFollow(db, "n1", "f1"); // follows someone else

    expect(await notifyFollowers(deps(), id)).toBe(1);
    expect(sent).toHaveLength(1);
    const [email] = sent[0].emails;
    expect(email.to).toBe("f1@x.com");
    expect(email.subject).toBe("Ada published “Cold <email>”");
    expect(email.html).toContain(`https://app.test/p/${id}`);
    expect(email.unsubscribeUrl).toContain("u=f1");
    expect(sent[0].key).toBe(`notify-${id}-0`);
  });

  it("sends nothing if the prompt was unpublished before the job ran", async () => {
    const id = await publishedPrompt();
    await toggleFollow(db, "f1", "author");
    await db.update(prompts).set({ visibility: "private" }).where(eq(prompts.id, id));
    expect(await notifyFollowers(deps(), id)).toBe(0);
    expect(sent).toEqual([]);
  });

  it("splits large audiences into batches with distinct keys", async () => {
    const id = await publishedPrompt();
    const many = Array.from({ length: BATCH_SIZE + 20 }, (_, i) => ({
      id: `u${String(i).padStart(4, "0")}`,
      username: `u${i}`,
      email: `u${i}@x.com`,
    }));
    await db.insert(users).values(many);
    for (const u of many) await toggleFollow(db, u.id, "author");

    expect(await notifyFollowers(deps(), id)).toBe(BATCH_SIZE + 20);
    expect(sent.map((b) => [b.key, b.emails.length])).toEqual([
      [`notify-${id}-0`, BATCH_SIZE],
      [`notify-${id}-1`, 20],
    ]);
    const all = sent.flatMap((b) => b.emails.map((e) => e.to));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("sendAnnouncement", () => {
  it("only emails newsletter subscribers", async () => {
    expect(await sendAnnouncement(deps(), { subject: "Hi", body: "News" }, "job1")).toBe(1);
    expect(sent[0].emails.map((e) => e.to)).toEqual(["n1@x.com"]);
    expect(sent[0].key).toBe("announce-job1-0");
  });
});
