import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { usageDaily } from "@/server/db/schema";

export type QuotaKind = "runs" | "enhances";

/** Days are counted in UTC so limits reset at the same moment for everyone. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically takes one unit of today's quota. Returns the day it was counted on (pass it to
 * releaseQuota/recordCost so a run spanning midnight settles on the same day), or null when
 * the limit is reached. Race-free: the increment only applies while below the limit.
 */
export async function reserveQuota(db: Db, userId: string, kind: QuotaKind, limit: number) {
  const column = usageDaily[kind];
  const day = today();
  const rows = await db
    .insert(usageDaily)
    .values({ userId, day, [kind]: 1 })
    .onConflictDoUpdate({
      target: [usageDaily.userId, usageDaily.day],
      set: { [kind]: sql`${column} + 1` },
      setWhere: sql`${column} < ${limit}`,
    })
    .returning({ used: column });
  return rows.length > 0 ? day : null;
}

/** Gives a unit back, e.g. when the model call failed. */
export async function releaseQuota(db: Db, userId: string, kind: QuotaKind, day: string) {
  const column = usageDaily[kind];
  await db
    .update(usageDaily)
    .set({ [kind]: sql`greatest(${column} - 1, 0)` })
    .where(and(eq(usageDaily.userId, userId), eq(usageDaily.day, day)));
}

export async function recordCost(db: Db, userId: string, costUsd: number, day: string) {
  if (costUsd <= 0) return;
  await db
    .update(usageDaily)
    .set({ costUsd: sql`${usageDaily.costUsd} + ${costUsd}` })
    .where(and(eq(usageDaily.userId, userId), eq(usageDaily.day, day)));
}

export async function getUsage(db: Db, userId: string) {
  const row = await db.query.usageDaily.findFirst({
    where: and(eq(usageDaily.userId, userId), eq(usageDaily.day, today())),
  });
  return {
    runs: row?.runs ?? 0,
    enhances: row?.enhances ?? 0,
    costUsd: Number(row?.costUsd ?? 0),
  };
}

/** False once today's AI spend reached the plan's budget (checked before each model call). */
export async function withinBudget(db: Db, userId: string, budgetUsd: number) {
  return (await getUsage(db, userId)).costUsd < budgetUsd;
}
