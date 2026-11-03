import "server-only";
import { and, asc, count, eq, inArray, or, sql } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import {
  commentLikes,
  comments,
  follows,
  likes,
  prompts,
  saves,
  shares,
  users,
} from "@/server/db/schema";
import { isPublicPrompt, publicAuthor } from "./community";

// Likes and saves only apply to public prompts. Each toggle returns null when not allowed.

export async function toggleLike(db: Db, userId: string, promptId: string) {
  if (!(await isPublicPrompt(db, promptId))) return null;
  const added = await db
    .insert(likes)
    .values({ userId, promptId })
    .onConflictDoNothing()
    .returning();
  if (added.length === 0) {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.promptId, promptId)));
  }
  const [{ n }] = await db.select({ n: count() }).from(likes).where(eq(likes.promptId, promptId));
  return { active: added.length > 0, count: n };
}

export async function toggleSave(db: Db, userId: string, promptId: string) {
  if (!(await isPublicPrompt(db, promptId))) return null;
  const added = await db
    .insert(saves)
    .values({ userId, promptId })
    .onConflictDoNothing()
    .returning();
  if (added.length === 0) {
    await db.delete(saves).where(and(eq(saves.userId, userId), eq(saves.promptId, promptId)));
  }
  const [{ n }] = await db.select({ n: count() }).from(saves).where(eq(saves.promptId, promptId));
  return { active: added.length > 0, count: n };
}

export async function recordShare(db: Db, userId: string, promptId: string, channel: string) {
  if (!(await isPublicPrompt(db, promptId))) return null;
  await db.insert(shares).values({ userId, promptId, channel });
  const [{ n }] = await db.select({ n: count() }).from(shares).where(eq(shares.promptId, promptId));
  return { count: n };
}

// Comments

export async function addComment(db: Db, userId: string, promptId: string, body: string) {
  if (!(await isPublicPrompt(db, promptId))) return null;
  const [row] = await db.insert(comments).values({ userId, promptId, body }).returning();
  return row;
}

/** The comment's author or the prompt's owner may delete it. */
export async function deleteComment(db: Db, userId: string, commentId: string) {
  const ownedPrompts = db
    .select({ id: prompts.id })
    .from(prompts)
    .where(eq(prompts.ownerId, userId));
  const [row] = await db
    .delete(comments)
    .where(
      and(
        eq(comments.id, commentId),
        or(eq(comments.userId, userId), inArray(comments.promptId, ownedPrompts)),
      ),
    )
    .returning({ id: comments.id });
  return row ?? null;
}

export async function listComments(db: Db, promptId: string, viewerId: string | null) {
  const likeCounts = db
    .select({ commentId: commentLikes.commentId, n: sql<number>`count(*)::int`.as("n") })
    .from(commentLikes)
    .groupBy(commentLikes.commentId)
    .as("comment_like_counts");

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      author: publicAuthor,
      likes: sql<number>`coalesce(${likeCounts.n}, 0)`.mapWith(Number),
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .leftJoin(likeCounts, eq(likeCounts.commentId, comments.id))
    .where(eq(comments.promptId, promptId))
    .orderBy(asc(comments.createdAt));

  const liked = new Set<string>();
  if (viewerId && rows.length > 0) {
    const mine = await db
      .select({ id: commentLikes.commentId })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, viewerId),
          inArray(
            commentLikes.commentId,
            rows.map((r) => r.id),
          ),
        ),
      );
    for (const r of mine) liked.add(r.id);
  }
  return rows.map((r) => ({ ...r, likedByViewer: liked.has(r.id) }));
}

export async function toggleCommentLike(db: Db, userId: string, commentId: string) {
  const [comment] = await db
    .select({ id: comments.id })
    .from(comments)
    .innerJoin(prompts, eq(prompts.id, comments.promptId))
    .where(and(eq(comments.id, commentId), eq(prompts.visibility, "public")));
  if (!comment) return null;

  const added = await db
    .insert(commentLikes)
    .values({ userId, commentId })
    .onConflictDoNothing()
    .returning();
  if (added.length === 0) {
    await db
      .delete(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
  }
  const [{ n }] = await db
    .select({ n: count() })
    .from(commentLikes)
    .where(eq(commentLikes.commentId, commentId));
  return { active: added.length > 0, count: n };
}

// Follows and profiles

export async function toggleFollow(db: Db, followerId: string, followeeId: string) {
  if (followerId === followeeId) return null;
  const target = await db.query.users.findFirst({ where: eq(users.id, followeeId) });
  if (!target) return null;

  const added = await db
    .insert(follows)
    .values({ followerId, followeeId })
    .onConflictDoNothing()
    .returning();
  if (added.length === 0) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  }
  const [{ n }] = await db
    .select({ n: count() })
    .from(follows)
    .where(eq(follows.followeeId, followeeId));
  return { active: added.length > 0, count: n };
}

/** Public profile by username, with counts and whether the viewer follows them. */
export async function getProfile(db: Db, username: string, viewerId: string | null) {
  const [user] = await db
    .select({ ...publicAuthor, bio: users.bio, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.username, username));
  if (!user) return null;

  const [[followers], [following], [published], [likesReceived], viewerFollows] = await Promise.all(
    [
      db.select({ n: count() }).from(follows).where(eq(follows.followeeId, user.id)),
      db.select({ n: count() }).from(follows).where(eq(follows.followerId, user.id)),
      db
        .select({ n: count() })
        .from(prompts)
        .where(and(eq(prompts.ownerId, user.id), eq(prompts.visibility, "public"))),
      db
        .select({ n: count() })
        .from(likes)
        .innerJoin(prompts, eq(prompts.id, likes.promptId))
        .where(and(eq(prompts.ownerId, user.id), eq(prompts.visibility, "public"))),
      viewerId
        ? db
            .select({ id: follows.followeeId })
            .from(follows)
            .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, user.id)))
        : Promise.resolve([]),
    ],
  );

  return {
    ...user,
    followers: followers.n,
    following: following.n,
    published: published.n,
    likesReceived: likesReceived.n,
    isFollowing: viewerFollows.length > 0,
    isSelf: viewerId === user.id,
  };
}
