import "server-only";
import { and, desc, eq, gte, isNotNull, ne, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";
import { LEADERBOARD_POINTS } from "@/config/engagement";
import type { Db } from "@/server/db/types";
import { likes, prompts, saves, users } from "@/server/db/schema";
import { today } from "@/server/quota";

/**
 * Records activity for today's streak: same day → unchanged, yesterday → +1, older → back to 1.
 * One UPDATE, so concurrent calls can't double count.
 */
export async function touchStreak(db: Db, userId: string, day = today()) {
  const next = sql`case
    when ${users.lastActiveDay} = ${day}::date then ${users.streakCurrent}
    when ${users.lastActiveDay} = ${day}::date - 1 then ${users.streakCurrent} + 1
    else 1 end`;
  const [row] = await db
    .update(users)
    .set({
      streakCurrent: next,
      streakBest: sql`greatest(${users.streakBest}, ${next})`,
      lastActiveDay: day,
    })
    .where(eq(users.id, userId))
    .returning({ current: users.streakCurrent, best: users.streakBest });
  return row ?? null;
}

/** A streak only counts if the user was active today or yesterday. */
export function liveStreak(
  user: { streakCurrent: number; lastActiveDay: string | null },
  day = today(),
) {
  if (!user.lastActiveDay) return 0;
  const gapDays = (Date.parse(day) - Date.parse(user.lastActiveDay)) / 86_400_000;
  return gapDays <= 1 ? user.streakCurrent : 0;
}

/**
 * Leaderboard: points for engagement others give your public prompts (likes, saves, forks)
 * plus a little for publishing. Self-engagement doesn't count.
 */
export async function getLeaderboard(db: Db, opts: { since?: Date; limit?: number } = {}) {
  const P = LEADERBOARD_POINTS;
  const source = alias(prompts, "source");
  const pts = (n: number) => sql<number>`${n}::int`.as("pts");

  const events = unionAll(
    db
      .select({ userId: prompts.ownerId, pts: pts(P.like), at: likes.createdAt })
      .from(likes)
      .innerJoin(prompts, eq(prompts.id, likes.promptId))
      .where(and(eq(prompts.visibility, "public"), ne(likes.userId, prompts.ownerId))),
    db
      .select({ userId: prompts.ownerId, pts: pts(P.save), at: saves.createdAt })
      .from(saves)
      .innerJoin(prompts, eq(prompts.id, saves.promptId))
      .where(and(eq(prompts.visibility, "public"), ne(saves.userId, prompts.ownerId))),
    db
      .select({ userId: source.ownerId, pts: pts(P.fork), at: prompts.createdAt })
      .from(prompts)
      .innerJoin(source, eq(source.id, prompts.forkedFromId))
      .where(and(eq(source.visibility, "public"), ne(prompts.ownerId, source.ownerId))),
    db
      .select({
        userId: prompts.ownerId,
        pts: pts(P.publish),
        at: sql<Date>`${prompts.publishedAt}`.as("at"),
      })
      .from(prompts)
      .where(and(eq(prompts.visibility, "public"), isNotNull(prompts.publishedAt))),
  ).as("events");

  const points = sql<number>`sum(${events.pts})::int`.mapWith(Number);
  return db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
      streakCurrent: users.streakCurrent,
      lastActiveDay: users.lastActiveDay,
      points,
    })
    .from(events)
    .innerJoin(users, eq(users.id, events.userId))
    .where(opts.since ? gte(events.at, opts.since) : undefined)
    .groupBy(users.id)
    .orderBy(desc(points), users.username)
    .limit(opts.limit ?? 50);
}
