import "server-only";
import { and, arrayContains, desc, eq, gt, inArray, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import {
  comments,
  follows,
  likes,
  prompts,
  saves,
  shares,
  users,
  versions,
} from "@/server/db/schema";
import { getBestRun } from "./runs";

/** Fields of a user that are safe to show publicly (never email, plan or role). */
export const publicAuthor = {
  id: users.id,
  username: users.username,
  name: users.name,
  avatarUrl: users.avatarUrl,
};

export async function isPublicPrompt(db: Db, promptId: string) {
  const [row] = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(and(eq(prompts.id, promptId), eq(prompts.visibility, "public")));
  return !!row;
}

/** Makes a prompt public, showing the chosen version. `firstPublish` is true only the first time. */
export async function publishPrompt(db: Db, ownerId: string, promptId: string, versionId: string) {
  const [version] = await db
    .select({ id: versions.id, publishedAt: prompts.publishedAt })
    .from(versions)
    .innerJoin(prompts, eq(prompts.id, versions.promptId))
    .where(and(eq(versions.id, versionId), eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)));
  if (!version) return null;

  const [row] = await db
    .update(prompts)
    .set({
      visibility: "public",
      bestVersionId: versionId,
      publishedAt: sql`coalesce(${prompts.publishedAt}, now())`,
    })
    .where(eq(prompts.id, promptId))
    .returning({ id: prompts.id });
  return { id: row.id, firstPublish: version.publishedAt === null };
}

export async function unpublishPrompt(db: Db, ownerId: string, promptId: string) {
  const [row] = await db
    .update(prompts)
    .set({ visibility: "private" })
    .where(and(eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)))
    .returning({ id: prompts.id });
  return row ?? null;
}

const countAs = (name: string) => sql<number>`count(*)::int`.as(name);

export type FeedOptions = {
  sort?: "new" | "top";
  authorId?: string;
  followingOf?: string;
  savedBy?: string;
  tag?: string;
  promptId?: string;
  limit?: number;
  offset?: number;
};

/** Public prompts with author, a content preview and engagement counts. */
export async function listPublicPrompts(db: Db, opts: FeedOptions = {}) {
  const likeCounts = db
    .select({ promptId: likes.promptId, n: countAs("like_n") })
    .from(likes)
    .groupBy(likes.promptId)
    .as("like_counts");
  const weekLikes = db
    .select({ promptId: likes.promptId, n: countAs("week_n") })
    .from(likes)
    .where(gt(likes.createdAt, sql`now() - interval '7 days'`))
    .groupBy(likes.promptId)
    .as("week_likes");
  const saveCounts = db
    .select({ promptId: saves.promptId, n: countAs("save_n") })
    .from(saves)
    .groupBy(saves.promptId)
    .as("save_counts");
  const shareCounts = db
    .select({ promptId: shares.promptId, n: countAs("share_n") })
    .from(shares)
    .groupBy(shares.promptId)
    .as("share_counts");
  const commentCounts = db
    .select({ promptId: comments.promptId, n: countAs("comment_n") })
    .from(comments)
    .groupBy(comments.promptId)
    .as("comment_counts");
  const forkCounts = db
    .select({ promptId: prompts.forkedFromId, n: countAs("fork_n") })
    .from(prompts)
    .groupBy(prompts.forkedFromId)
    .as("fork_counts");

  const filters: SQL[] = [eq(prompts.visibility, "public")];
  if (opts.promptId) filters.push(eq(prompts.id, opts.promptId));
  if (opts.authorId) filters.push(eq(prompts.ownerId, opts.authorId));
  if (opts.tag) filters.push(arrayContains(prompts.tags, [opts.tag]));
  if (opts.followingOf) {
    filters.push(
      inArray(
        prompts.ownerId,
        db
          .select({ id: follows.followeeId })
          .from(follows)
          .where(eq(follows.followerId, opts.followingOf)),
      ),
    );
  }
  if (opts.savedBy) {
    filters.push(
      inArray(
        prompts.id,
        db.select({ id: saves.promptId }).from(saves).where(eq(saves.userId, opts.savedBy)),
      ),
    );
  }

  const n = (col: SQL.Aliased<number>) => sql<number>`coalesce(${col}, 0)`.mapWith(Number);
  const order =
    opts.sort === "top"
      ? [desc(n(weekLikes.n)), desc(n(likeCounts.n)), desc(prompts.publishedAt)]
      : [desc(prompts.publishedAt)];

  return db
    .select({
      id: prompts.id,
      title: prompts.title,
      tags: prompts.tags,
      publishedAt: prompts.publishedAt,
      versionId: versions.id,
      versionNumber: versions.number,
      preview: sql<string>`left(${versions.content}, 300)`,
      author: publicAuthor,
      likes: n(likeCounts.n),
      saves: n(saveCounts.n),
      shares: n(shareCounts.n),
      comments: n(commentCounts.n),
      forks: n(forkCounts.n),
    })
    .from(prompts)
    .innerJoin(versions, eq(versions.id, prompts.bestVersionId))
    .innerJoin(users, eq(users.id, prompts.ownerId))
    .leftJoin(likeCounts, eq(likeCounts.promptId, prompts.id))
    .leftJoin(weekLikes, eq(weekLikes.promptId, prompts.id))
    .leftJoin(saveCounts, eq(saveCounts.promptId, prompts.id))
    .leftJoin(shareCounts, eq(shareCounts.promptId, prompts.id))
    .leftJoin(commentCounts, eq(commentCounts.promptId, prompts.id))
    .leftJoin(forkCounts, eq(forkCounts.promptId, prompts.id))
    .where(and(...filters))
    .orderBy(...order)
    .limit(opts.limit ?? 24)
    .offset(opts.offset ?? 0);
}

export type FeedItem = Awaited<ReturnType<typeof listPublicPrompts>>[number];

/** Which of these prompts the viewer has liked or saved. */
export async function getViewerFlags(db: Db, viewerId: string | null, promptIds: string[]) {
  if (!viewerId || promptIds.length === 0)
    return { liked: new Set<string>(), saved: new Set<string>() };
  const [liked, saved] = await Promise.all([
    db
      .select({ id: likes.promptId })
      .from(likes)
      .where(and(eq(likes.userId, viewerId), inArray(likes.promptId, promptIds))),
    db
      .select({ id: saves.promptId })
      .from(saves)
      .where(and(eq(saves.userId, viewerId), inArray(saves.promptId, promptIds))),
  ]);
  return { liked: new Set(liked.map((r) => r.id)), saved: new Set(saved.map((r) => r.id)) };
}

/** Everything the public prompt page shows, or null if the prompt isn't public. */
export async function getPublicPrompt(db: Db, promptId: string) {
  const [item] = await listPublicPrompts(db, { promptId, limit: 1 });
  if (!item) return null;

  const [version, bestRun, origin] = await Promise.all([
    db.query.versions.findFirst({ where: eq(versions.id, item.versionId) }),
    getBestRun(db, item.versionId),
    getForkOrigin(db, promptId),
  ]);
  return {
    ...item,
    content: version?.content ?? "",
    ownerId: item.author.id,
    bestRun:
      bestRun && bestRun.userId === item.author.id
        ? {
            modelId: bestRun.modelId,
            output: bestRun.output,
            temperature: bestRun.temperature,
            latencyMs: bestRun.latencyMs,
            outputTokens: bestRun.outputTokens,
          }
        : null,
    forkedFrom: origin,
  };
}

/** The public prompt this one was forked from, if it's still public. */
async function getForkOrigin(db: Db, promptId: string) {
  const origin = db
    .select({ forkedFromId: prompts.forkedFromId })
    .from(prompts)
    .where(eq(prompts.id, promptId));
  const [row] = await db
    .select({ id: prompts.id, title: prompts.title, username: users.username })
    .from(prompts)
    .innerJoin(users, eq(users.id, prompts.ownerId))
    .where(and(inArray(prompts.id, origin), eq(prompts.visibility, "public")));
  return row ?? null;
}

/** Copies a public prompt's published version into the user's own prompts. */
export async function forkPrompt(db: Db, userId: string, promptId: string) {
  const [source] = await db
    .select({
      title: prompts.title,
      tags: prompts.tags,
      content: versions.content,
      username: users.username,
    })
    .from(prompts)
    .innerJoin(versions, eq(versions.id, prompts.bestVersionId))
    .innerJoin(users, eq(users.id, prompts.ownerId))
    .where(and(eq(prompts.id, promptId), eq(prompts.visibility, "public")));
  if (!source) return null;

  return db.transaction(async (tx) => {
    const [fork] = await tx
      .insert(prompts)
      .values({ ownerId: userId, title: source.title, tags: source.tags, forkedFromId: promptId })
      .returning({ id: prompts.id });
    await tx.insert(versions).values({
      promptId: fork.id,
      number: 1,
      content: source.content,
      source: "fork",
      note: `Forked from @${source.username}`,
    });
    return fork;
  });
}
