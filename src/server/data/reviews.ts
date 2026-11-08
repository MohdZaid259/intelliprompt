import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { reviews, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";

/** Cache tag of the landing page's review section. */
export const REVIEWS_TAG = "reviews";

export type ReviewInput = { rating: number; body: string; headline: string };

export type PublicReview = {
  id: string;
  rating: number;
  body: string;
  headline: string;
  author: { name: string; username: string; avatarUrl: string };
};

/** Creates or updates the user's review. Any change goes back to "waiting for approval". */
export async function upsertReview(db: Db, userId: string, input: ReviewInput) {
  const [row] = await db
    .insert(reviews)
    .values({ userId, ...input })
    .onConflictDoUpdate({
      target: reviews.userId,
      set: { ...input, approved: false, updatedAt: sql`now()` },
    })
    .returning();
  return row;
}

export async function getUserReview(db: Db, userId: string) {
  return (await db.query.reviews.findFirst({ where: eq(reviews.userId, userId) })) ?? null;
}

const reviewWithAuthor = {
  id: reviews.id,
  rating: reviews.rating,
  body: reviews.body,
  headline: reviews.headline,
  approved: reviews.approved,
  updatedAt: reviews.updatedAt,
  name: users.name,
  username: users.username,
  avatarUrl: users.avatarUrl,
};

function toPublic(r: {
  id: string;
  rating: number;
  body: string;
  headline: string;
  name: string;
  username: string;
  avatarUrl: string;
}): PublicReview {
  return {
    id: r.id,
    rating: r.rating,
    body: r.body,
    headline: r.headline,
    author: { name: r.name, username: r.username, avatarUrl: r.avatarUrl },
  };
}

/** Approved reviews for the landing page, best and newest first. */
export async function listApprovedReviews(db: Db, limit = 24): Promise<PublicReview[]> {
  const rows = await db
    .select(reviewWithAuthor)
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.rating), desc(reviews.updatedAt))
    .limit(limit);
  return rows.map(toPublic);
}

/** Every review for the admin page, waiting ones first. */
export async function listReviewsForAdmin(db: Db) {
  const rows = await db
    .select(reviewWithAuthor)
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .orderBy(reviews.approved, desc(reviews.updatedAt))
    .limit(200);
  return rows.map((r) => ({ ...toPublic(r), approved: r.approved, updatedAt: r.updatedAt }));
}

export async function setReviewApproved(db: Db, id: string, approved: boolean) {
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id));
}

export async function deleteReview(db: Db, id: string, userId?: string) {
  await db
    .delete(reviews)
    .where(userId ? and(eq(reviews.id, id), eq(reviews.userId, userId)) : eq(reviews.id, id));
}
