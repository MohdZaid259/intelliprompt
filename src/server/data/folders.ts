import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { folders, prompts } from "@/server/db/schema";

export const MAX_FOLDERS = 50;

export type FolderResult<T> = { ok: true; value: T } | { ok: false; reason: "duplicate" | "limit" };

/** The user's folders, A→Z, with how many prompts each holds. */
export async function listFolders(db: Db, ownerId: string) {
  return db
    .select({ id: folders.id, name: folders.name, promptCount: count(prompts.id) })
    .from(folders)
    .leftJoin(prompts, eq(prompts.folderId, folders.id))
    .where(eq(folders.ownerId, ownerId))
    .groupBy(folders.id)
    .orderBy(asc(folders.name));
}

export type FolderSummary = Awaited<ReturnType<typeof listFolders>>[number];

export async function getOwnedFolder(db: Db, ownerId: string, folderId: string) {
  const [row] = await db
    .select({ id: folders.id, name: folders.name })
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, ownerId)));
  return row ?? null;
}

export async function createFolder(
  db: Db,
  ownerId: string,
  name: string,
): Promise<FolderResult<{ id: string }>> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(folders)
    .where(eq(folders.ownerId, ownerId));
  if (total >= MAX_FOLDERS) return { ok: false, reason: "limit" };

  const [row] = await db
    .insert(folders)
    .values({ ownerId, name })
    .onConflictDoNothing()
    .returning({ id: folders.id });
  return row ? { ok: true, value: row } : { ok: false, reason: "duplicate" };
}

/** Returns null when the folder isn't the user's. */
export async function renameFolder(
  db: Db,
  ownerId: string,
  folderId: string,
  name: string,
): Promise<FolderResult<{ id: string }> | null> {
  if (!(await getOwnedFolder(db, ownerId, folderId))) return null;
  const clash = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.ownerId, ownerId), eq(folders.name, name)));
  if (clash.some((f) => f.id !== folderId)) return { ok: false, reason: "duplicate" };
  await db.update(folders).set({ name }).where(eq(folders.id, folderId));
  return { ok: true, value: { id: folderId } };
}

/** Deletes the folder; its prompts stay and become unsorted. */
export async function deleteFolder(db: Db, ownerId: string, folderId: string) {
  const [row] = await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, ownerId)))
    .returning({ id: folders.id });
  return row ?? null;
}

/**
 * Moves an owned prompt into an owned folder, or out of any folder (folderId null).
 * Returns null if either isn't the user's.
 */
export async function movePrompt(
  db: Db,
  ownerId: string,
  promptId: string,
  folderId: string | null,
) {
  if (folderId && !(await getOwnedFolder(db, ownerId, folderId))) return null;
  const [row] = await db
    .update(prompts)
    .set({ folderId })
    .where(and(eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)))
    .returning({ id: prompts.id });
  return row ?? null;
}
