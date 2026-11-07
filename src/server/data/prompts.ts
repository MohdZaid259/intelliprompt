import "server-only";
import { and, count, desc, eq, isNull, max, or, sql } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { folders, prompts, versions } from "@/server/db/schema";
import { getOwnedFolder } from "./folders";

type VersionSource = (typeof versions.$inferInsert)["source"];

export type PromptInput = {
  title: string;
  content: string;
  tags: string[];
  folderId?: string | null;
};

export async function createPrompt(db: Db, ownerId: string, input: PromptInput) {
  // a folder that isn't the user's is ignored rather than trusted
  const folderId =
    input.folderId && (await getOwnedFolder(db, ownerId, input.folderId)) ? input.folderId : null;
  return db.transaction(async (tx) => {
    const [prompt] = await tx
      .insert(prompts)
      .values({ ownerId, folderId, title: input.title, tags: input.tags })
      .returning({ id: prompts.id });
    await tx.insert(versions).values({ promptId: prompt.id, number: 1, content: input.content });
    return prompt;
  });
}

/**
 * The user's prompts, most recently updated first.
 * folder: undefined = all, null = unsorted only, id = that folder only.
 */
export async function listPrompts(
  db: Db,
  ownerId: string,
  opts: { folder?: string | null; limit?: number } = {},
) {
  const folderFilter =
    opts.folder === undefined
      ? undefined
      : opts.folder === null
        ? isNull(prompts.folderId)
        : eq(prompts.folderId, opts.folder);
  const query = db
    .select({
      id: prompts.id,
      title: prompts.title,
      tags: prompts.tags,
      visibility: prompts.visibility,
      updatedAt: prompts.updatedAt,
      folderId: prompts.folderId,
      folderName: folders.name,
      versionCount: count(versions.id),
      latest: max(versions.number),
      // first 240 characters of the newest version, for cards
      preview: sql<string>`(select left(lv.content, 240) from ${versions} lv
        where lv.prompt_id = ${prompts.id} order by lv.number desc limit 1)`,
    })
    .from(prompts)
    .leftJoin(versions, eq(versions.promptId, prompts.id))
    .leftJoin(folders, eq(folders.id, prompts.folderId))
    .where(and(eq(prompts.ownerId, ownerId), folderFilter))
    .groupBy(prompts.id, folders.name)
    .orderBy(desc(prompts.updatedAt));
  return opts.limit ? query.limit(opts.limit) : query;
}

export type PromptSummary = Awaited<ReturnType<typeof listPrompts>>[number];

/** A prompt with all its versions (newest first), or null if missing or not owned. */
export async function getOwnedPrompt(db: Db, ownerId: string, promptId: string) {
  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)),
    with: { versions: { orderBy: desc(versions.number) } },
  });
  return prompt ?? null;
}

export async function updatePromptMeta(
  db: Db,
  ownerId: string,
  promptId: string,
  meta: { title: string; tags: string[] },
) {
  const [row] = await db
    .update(prompts)
    .set(meta)
    .where(and(eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)))
    .returning({ id: prompts.id });
  return row ?? null;
}

export async function deletePrompt(db: Db, ownerId: string, promptId: string) {
  const [row] = await db
    .delete(prompts)
    .where(and(eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)))
    .returning({ id: prompts.id });
  return row ?? null;
}

/** Appends a new immutable version. Returns null if the prompt isn't owned by the user. */
export async function addVersion(
  db: Db,
  ownerId: string,
  promptId: string,
  input: { content: string; note?: string; source?: VersionSource },
) {
  return db.transaction(async (tx) => {
    // lock the prompt row so concurrent saves get sequential numbers
    const [prompt] = await tx
      .select({ id: prompts.id })
      .from(prompts)
      .where(and(eq(prompts.id, promptId), eq(prompts.ownerId, ownerId)))
      .for("update");
    if (!prompt) return null;

    const [{ last }] = await tx
      .select({ last: max(versions.number) })
      .from(versions)
      .where(eq(versions.promptId, promptId));

    const [version] = await tx
      .insert(versions)
      .values({
        promptId,
        number: (last ?? 0) + 1,
        content: input.content,
        note: input.note ?? "",
        source: input.source ?? "manual",
      })
      .returning();
    await tx.update(prompts).set({ updatedAt: new Date() }).where(eq(prompts.id, promptId));
    return version;
  });
}

/** Copies an old version's content into a new latest version. */
export async function restoreVersion(db: Db, ownerId: string, versionId: string) {
  const old = await getOwnedVersion(db, ownerId, versionId);
  if (!old) return null;
  return addVersion(db, ownerId, old.promptId, {
    content: old.content,
    note: `Restored from v${old.number}`,
    source: "restored",
  });
}

export async function getOwnedVersion(db: Db, ownerId: string, versionId: string) {
  const [row] = await db
    .select({
      id: versions.id,
      promptId: versions.promptId,
      number: versions.number,
      content: versions.content,
    })
    .from(versions)
    .innerJoin(prompts, eq(prompts.id, versions.promptId))
    .where(and(eq(versions.id, versionId), eq(prompts.ownerId, ownerId)));
  return row ?? null;
}

/** A version the user may run: their own, or one belonging to a public prompt. */
export async function getRunnableVersion(db: Db, userId: string, versionId: string) {
  const [row] = await db
    .select({ id: versions.id, content: versions.content, ownerId: prompts.ownerId })
    .from(versions)
    .innerJoin(prompts, eq(prompts.id, versions.promptId))
    .where(
      and(
        eq(versions.id, versionId),
        or(eq(prompts.ownerId, userId), eq(prompts.visibility, "public")),
      ),
    );
  return row ?? null;
}
