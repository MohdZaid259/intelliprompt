"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { folderNameSchema, idSchema } from "@/lib/validation";
import { db } from "@/server/db";
import {
  createFolder,
  deleteFolder,
  MAX_FOLDERS,
  movePrompt,
  renameFolder,
  type FolderResult,
} from "@/server/data/folders";
import { authedAction, UserError } from "./safe-action";

function unwrap<T>(result: FolderResult<T>) {
  if (result.ok) return result.value;
  throw new UserError(
    result.reason === "limit"
      ? `You can have up to ${MAX_FOLDERS} folders.`
      : "You already have a folder with that name.",
  );
}

const notFound = () => new UserError("That folder doesn't exist or isn't yours.");

export const createFolderAction = authedAction(
  z.object({ name: folderNameSchema }),
  async ({ name }, user) => {
    const folder = unwrap(await createFolder(db(), user.id, name));
    refresh();
    return folder;
  },
);

export const renameFolderAction = authedAction(
  z.object({ folderId: idSchema, name: folderNameSchema }),
  async ({ folderId, name }, user) => {
    const result = await renameFolder(db(), user.id, folderId, name);
    if (!result) throw notFound();
    unwrap(result);
    refresh();
  },
);

export const deleteFolderAction = authedAction(
  z.object({ folderId: idSchema, redirectTo: z.enum(["/folders"]).optional() }),
  async ({ folderId, redirectTo }, user) => {
    if (!(await deleteFolder(db(), user.id, folderId))) throw notFound();
    if (redirectTo) redirect(redirectTo);
    refresh();
  },
);

export const movePromptAction = authedAction(
  z.object({ promptId: idSchema, folderId: idSchema.nullable() }),
  async ({ promptId, folderId }, user) => {
    if (!(await movePrompt(db(), user.id, promptId, folderId))) {
      throw new UserError("Couldn't move that prompt.");
    }
    refresh();
  },
);
