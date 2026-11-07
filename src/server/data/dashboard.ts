import "server-only";
import { and, count, eq, gte, ne } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { likes, prompts, runs, saves, users, versions } from "@/server/db/schema";
import { liveStreak } from "./engagement";

/** Numbers for the dashboard cards. Likes/saves only count other people's. */
export async function getDashboardStats(db: Db, userId: string, now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const owned = eq(prompts.ownerId, userId);

  const [
    [user],
    [promptTotals],
    [published],
    [likeTotals],
    [likesThisWeek],
    [saveTotals],
    [runTotals],
  ] = await Promise.all([
    db
      .select({
        streakCurrent: users.streakCurrent,
        streakBest: users.streakBest,
        lastActiveDay: users.lastActiveDay,
      })
      .from(users)
      .where(eq(users.id, userId)),
    db.select({ n: count() }).from(prompts).where(owned),
    db
      .select({ n: count() })
      .from(prompts)
      .where(and(owned, eq(prompts.visibility, "public"))),
    db
      .select({ n: count() })
      .from(likes)
      .innerJoin(prompts, eq(prompts.id, likes.promptId))
      .where(and(owned, ne(likes.userId, userId))),
    db
      .select({ n: count() })
      .from(likes)
      .innerJoin(prompts, eq(prompts.id, likes.promptId))
      .where(and(owned, ne(likes.userId, userId), gte(likes.createdAt, weekAgo))),
    db
      .select({ n: count() })
      .from(saves)
      .innerJoin(prompts, eq(prompts.id, saves.promptId))
      .where(and(owned, ne(saves.userId, userId))),
    db
      .select({ n: count() })
      .from(runs)
      .innerJoin(versions, eq(versions.id, runs.versionId))
      .innerJoin(prompts, eq(prompts.id, versions.promptId))
      .where(and(owned, eq(runs.userId, userId))),
  ]);

  return {
    streak: user ? liveStreak(user) : 0,
    bestStreak: user?.streakBest ?? 0,
    prompts: promptTotals.n,
    published: published.n,
    likes: likeTotals.n,
    likesThisWeek: likesThisWeek.n,
    saves: saveTotals.n,
    runs: runTotals.n,
  };
}
