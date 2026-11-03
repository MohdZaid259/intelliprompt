import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { prompts, runs, versions } from "@/server/db/schema";

export type NewRun = typeof runs.$inferInsert;

export async function insertRun(db: Db, run: NewRun) {
  const [row] = await db.insert(runs).values(run).returning();
  return row;
}

/** The owner's runs for the given versions, newest first. */
export async function listRunsForVersions(db: Db, ownerId: string, versionIds: string[]) {
  if (versionIds.length === 0) return [];
  return db
    .select()
    .from(runs)
    .where(and(inArray(runs.versionId, versionIds), eq(runs.userId, ownerId)))
    .orderBy(desc(runs.createdAt));
}

/** A run the prompt owner made on their own prompt (only these can be the "best" answer). */
async function getOwnersRun(db: Db, ownerId: string, runId: string) {
  const [row] = await db
    .select({ id: runs.id, versionId: runs.versionId, isBest: runs.isBest, status: runs.status })
    .from(runs)
    .innerJoin(versions, eq(versions.id, runs.versionId))
    .innerJoin(prompts, eq(prompts.id, versions.promptId))
    .where(and(eq(runs.id, runId), eq(prompts.ownerId, ownerId), eq(runs.userId, ownerId)));
  return row ?? null;
}

/** Toggles a run as the best answer for its version (only one best per version). */
export async function toggleBestRun(db: Db, ownerId: string, runId: string) {
  const run = await getOwnersRun(db, ownerId, runId);
  if (!run || run.status !== "ok") return null;

  return db.transaction(async (tx) => {
    await tx
      .update(runs)
      .set({ isBest: false })
      .where(and(eq(runs.versionId, run.versionId), eq(runs.isBest, true)));
    if (!run.isBest) await tx.update(runs).set({ isBest: true }).where(eq(runs.id, run.id));
    return { id: run.id, isBest: !run.isBest };
  });
}

/** Whoever made a run can delete it. */
export async function deleteRun(db: Db, userId: string, runId: string) {
  const [row] = await db
    .delete(runs)
    .where(and(eq(runs.id, runId), eq(runs.userId, userId)))
    .returning({ id: runs.id });
  return row ?? null;
}

/** The best answer the owner picked for a version, if any. */
export async function getBestRun(db: Db, versionId: string) {
  const [row] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.versionId, versionId), eq(runs.isBest, true)));
  return row ?? null;
}
