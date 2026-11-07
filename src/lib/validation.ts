import { z } from "zod";

// Shared between forms (client) and server actions.
export const LIMITS = { title: 120, content: 20_000, tags: 5, tag: 24, note: 200 } as const;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Give your prompt a title")
  .max(LIMITS.title, `Title must be at most ${LIMITS.title} characters`);

export const contentSchema = z
  .string()
  .trim()
  .min(1, "The prompt can't be empty")
  .max(LIMITS.content, `Prompt must be at most ${LIMITS.content.toLocaleString()} characters`);

export const tagsSchema = z
  .array(
    z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .max(LIMITS.tag, `Tags must be at most ${LIMITS.tag} characters`),
  )
  .max(LIMITS.tags, `At most ${LIMITS.tags} tags`)
  .transform((tags) => [...new Set(tags)]);

export const idSchema = z.uuid("Invalid id");

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "Give the folder a name")
  .max(60, "Folder names can be at most 60 characters");
