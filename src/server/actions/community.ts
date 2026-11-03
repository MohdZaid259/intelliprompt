"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { idSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { forkPrompt, publishPrompt, unpublishPrompt } from "@/server/data/community";
import { touchStreak } from "@/server/data/engagement";
import {
  addComment,
  deleteComment,
  recordShare,
  toggleCommentLike,
  toggleFollow,
  toggleLike,
  toggleSave,
} from "@/server/data/social";
import { enqueueEmail } from "@/server/email/queue";
import { promptTag } from "@/server/public-card";
import { checkRateLimit } from "@/server/rate-limit";
import { authedAction, UserError } from "./safe-action";

const notPublic = () => new UserError("That prompt isn't public.");

export const publishAction = authedAction(
  z.object({ promptId: idSchema, versionId: idSchema }),
  async ({ promptId, versionId }, user) => {
    const published = await publishPrompt(db(), user.id, promptId, versionId);
    if (!published) throw new UserError("Couldn't publish that version.");
    await touchStreak(db(), user.id);
    if (published.firstPublish && (await checkRateLimit("notifyFollowers", user.id)).ok) {
      // jobId dedupes: followers hear about a prompt once, even if it's unpublished and republished
      await enqueueEmail(
        { name: "notify-followers", data: { promptId } },
        { jobId: `notify-${promptId}` },
      );
    }
    updateTag(promptTag(promptId));
    refresh();
  },
  { rateLimit: "publish" },
);

export const unpublishAction = authedAction(
  z.object({ promptId: idSchema }),
  async ({ promptId }, user) => {
    if (!(await unpublishPrompt(db(), user.id, promptId))) throw new UserError("Prompt not found.");
    updateTag(promptTag(promptId));
    refresh();
  },
);

export const forkAction = authedAction(
  z.object({ promptId: idSchema }),
  async ({ promptId }, user) => {
    const fork = await forkPrompt(db(), user.id, promptId);
    if (!fork) throw notPublic();
    redirect(`/prompts/${fork.id}`);
  },
  { rateLimit: "fork" },
);

export const toggleLikeAction = authedAction(
  z.object({ promptId: idSchema }),
  async ({ promptId }, user) => {
    const result = await toggleLike(db(), user.id, promptId);
    if (!result) throw notPublic();
    return result;
  },
  { rateLimit: "react" },
);

export const toggleSaveAction = authedAction(
  z.object({ promptId: idSchema }),
  async ({ promptId }, user) => {
    const result = await toggleSave(db(), user.id, promptId);
    if (!result) throw notPublic();
    return result;
  },
  { rateLimit: "react" },
);

export const recordShareAction = authedAction(
  z.object({ promptId: idSchema, channel: z.enum(["link", "x", "linkedin", "whatsapp"]) }),
  async ({ promptId, channel }, user) => {
    const result = await recordShare(db(), user.id, promptId, channel);
    if (!result) throw notPublic();
    return result;
  },
  { rateLimit: "share" },
);

export const addCommentAction = authedAction(
  z.object({
    promptId: idSchema,
    body: z
      .string()
      .trim()
      .min(1, "Write something first")
      .max(1000, "Comments can be at most 1000 characters"),
  }),
  async ({ promptId, body }, user) => {
    if (!(await addComment(db(), user.id, promptId, body))) throw notPublic();
    refresh();
  },
  { rateLimit: "comment" },
);

export const deleteCommentAction = authedAction(
  z.object({ commentId: idSchema }),
  async ({ commentId }, user) => {
    if (!(await deleteComment(db(), user.id, commentId))) {
      throw new UserError("You can't delete that comment.");
    }
    refresh();
  },
);

export const toggleCommentLikeAction = authedAction(
  z.object({ commentId: idSchema }),
  async ({ commentId }, user) => {
    const result = await toggleCommentLike(db(), user.id, commentId);
    if (!result) throw new UserError("Comment not found.");
    return result;
  },
  { rateLimit: "react" },
);

export const toggleFollowAction = authedAction(
  z.object({ userId: z.string().min(1) }),
  async ({ userId }, user) => {
    const result = await toggleFollow(db(), user.id, userId);
    if (!result) throw new UserError("You can't follow that user.");
    return result;
  },
  { rateLimit: "follow" },
);
