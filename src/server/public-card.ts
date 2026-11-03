import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { getPublicPrompt } from "@/server/data/community";

export const promptTag = (promptId: string) => `prompt:${promptId}`;

/**
 * Small, cached summary of a public prompt for page metadata and the OG image.
 * Invalidated with updateTag(promptTag(id)) when the prompt is published, edited or removed.
 */
export async function getPromptCard(promptId: string) {
  "use cache";
  cacheTag(promptTag(promptId));
  cacheLife("hours");

  const prompt = await getPublicPrompt(db(), promptId);
  if (!prompt) return null;
  return {
    title: prompt.title,
    preview: prompt.preview,
    tags: prompt.tags,
    likes: prompt.likes,
    author: { username: prompt.author.username, name: prompt.author.name },
  };
}
