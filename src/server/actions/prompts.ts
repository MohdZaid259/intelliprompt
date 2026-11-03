"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PLANS } from "@/config/plans";
import { contentSchema, idSchema, LIMITS, tagsSchema, titleSchema } from "@/lib/validation";
import { enhancePrompt } from "@/server/ai/enhance";
import { openRouterKeys, openRouterModel } from "@/server/ai/client";
import { db } from "@/server/db";
import {
  addVersion,
  createPrompt,
  deletePrompt,
  restoreVersion,
  updatePromptMeta,
} from "@/server/data/prompts";
import { deleteRun, toggleBestRun } from "@/server/data/runs";
import { recordCost, releaseQuota, reserveQuota } from "@/server/quota";
import { authedAction, UserError } from "./safe-action";

const notFound = () => new UserError("That prompt doesn't exist or isn't yours.");

export const createPromptAction = authedAction(
  z.object({ title: titleSchema, content: contentSchema, tags: tagsSchema }),
  async (input, user) => {
    const { id } = await createPrompt(db(), user.id, input);
    redirect(`/prompts/${id}`);
  },
);

export const saveVersionAction = authedAction(
  z.object({
    promptId: idSchema,
    content: contentSchema,
    note: z.string().trim().max(LIMITS.note).optional(),
    source: z.enum(["manual", "enhanced"]).default("manual"),
  }),
  async ({ promptId, ...input }, user) => {
    const version = await addVersion(db(), user.id, promptId, input);
    if (!version) throw notFound();
    refresh();
    return { number: version.number };
  },
);

export const restoreVersionAction = authedAction(
  z.object({ versionId: idSchema }),
  async ({ versionId }, user) => {
    const version = await restoreVersion(db(), user.id, versionId);
    if (!version) throw notFound();
    refresh();
    return { number: version.number };
  },
);

export const updatePromptMetaAction = authedAction(
  z.object({ promptId: idSchema, title: titleSchema, tags: tagsSchema }),
  async ({ promptId, ...meta }, user) => {
    if (!(await updatePromptMeta(db(), user.id, promptId, meta))) throw notFound();
    refresh();
  },
);

export const deletePromptAction = authedAction(
  z.object({ promptId: idSchema }),
  async ({ promptId }, user) => {
    if (!(await deletePrompt(db(), user.id, promptId))) throw notFound();
    redirect("/prompts");
  },
);

export const enhanceAction = authedAction(
  z.object({ content: contentSchema }),
  async ({ content }, user) => {
    const limit = PLANS[user.plan].enhancesPerDay;
    if (!(await reserveQuota(db(), user.id, "enhances", limit))) {
      throw new UserError(`You've used all ${limit} enhancements for today.`);
    }
    try {
      const result = await enhancePrompt(content, {
        keys: openRouterKeys(),
        createModel: openRouterModel,
        userId: user.id,
      });
      await recordCost(db(), user.id, result.costUsd);
      return { prompt: result.prompt, changes: result.changes };
    } catch (error) {
      await releaseQuota(db(), user.id, "enhances");
      console.error("enhance failed", error);
      throw new UserError("Couldn't enhance the prompt right now. Please try again.");
    }
  },
);

export const toggleBestRunAction = authedAction(
  z.object({ runId: idSchema }),
  async ({ runId }, user) => {
    const result = await toggleBestRun(db(), user.id, runId);
    if (!result) throw new UserError("That answer can't be marked as best.");
    refresh();
    return result;
  },
);

export const deleteRunAction = authedAction(
  z.object({ runId: idSchema }),
  async ({ runId }, user) => {
    if (!(await deleteRun(db(), user.id, runId))) throw new UserError("Answer not found.");
    refresh();
  },
);
