import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import {
  deleteReview,
  getUserReview,
  listApprovedReviews,
  listReviewsForAdmin,
  setReviewApproved,
  upsertReview,
} from "./reviews";

let db: Db;
const text = "IntelliPrompt made my prompts much clearer and faster to test.";

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: "a", username: "asha", name: "Asha", email: "a@x.com" },
    { id: "b", username: "ben", name: "Ben", email: "b@x.com" },
  ]);
});

describe("reviews", () => {
  it("keeps one review per user and hides it again after an edit", async () => {
    const first = await upsertReview(db, "a", { rating: 5, body: text, headline: "Writer" });
    await setReviewApproved(db, first.id, true);
    expect(await listApprovedReviews(db)).toHaveLength(1);

    const edited = await upsertReview(db, "a", {
      rating: 4,
      body: `${text} Edited.`,
      headline: "",
    });
    expect(edited.id).toBe(first.id);
    expect(edited.approved).toBe(false);
    expect(await listApprovedReviews(db)).toHaveLength(0);
    expect((await getUserReview(db, "a"))?.rating).toBe(4);
  });

  it("only lists approved reviews publicly, with the author", async () => {
    const a = await upsertReview(db, "a", { rating: 5, body: text, headline: "" });
    await upsertReview(db, "b", { rating: 3, body: text, headline: "" });
    await setReviewApproved(db, a.id, true);
    const live = await listApprovedReviews(db);
    expect(live).toHaveLength(1);
    expect(live[0].author).toMatchObject({ name: "Asha", username: "asha" });
    // admins see everything, waiting first
    const all = await listReviewsForAdmin(db);
    expect(all.map((r) => r.approved)).toEqual([false, true]);
  });

  it("rejects out-of-range ratings and too-short text at the database level", async () => {
    await expect(upsertReview(db, "a", { rating: 6, body: text, headline: "" })).rejects.toThrow();
    await expect(
      upsertReview(db, "a", { rating: 5, body: "short", headline: "" }),
    ).rejects.toThrow();
  });

  it("deletes", async () => {
    const r = await upsertReview(db, "a", { rating: 5, body: text, headline: "" });
    await deleteReview(db, r.id);
    expect(await getUserReview(db, "a")).toBeNull();
  });
});
