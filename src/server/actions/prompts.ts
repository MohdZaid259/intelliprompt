"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BUDGET_MESSAGE, PLANS } from "@/config/plans";
import { contentSchema, idSchema, LIMITS, tagsSchema, titleSchema } from "@/lib/validation";
import { clarifyPrompt, enhancePrompt } from "@/server/ai/enhance";
import { openRouterKeys, openRouterModel } from "@/server/ai/client";
import { db } from "@/server/db";
import {
  addVersion,
  createPrompt,
  deletePrompt,
  restoreVersion,
  updatePromptMeta,
} from "@/server/data/prompts";
import { touchStreak } from "@/server/data/engagement";
import { deleteRun, toggleBestRun } from "@/server/data/runs";
import { promptTag } from "@/server/public-card";
import { addCost, recordCost, releaseQuota, reserveQuota, withinBudget } from "@/server/quota";
import { authedAction, UserError } from "./safe-action";

const notFound = () => new UserError("That prompt doesn't exist or isn't yours.");

export const createPromptAction = authedAction(
  z.object({
    title: titleSchema,
    content: contentSchema,
    tags: tagsSchema,
    folderId: idSchema.nullable().optional(),
  }),
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
    updateTag(promptTag(promptId));
    refresh();
  },
);

export const deletePromptAction = authedAction(
  // stay: deleting from a list refreshes it instead of leaving the page
  z.object({ promptId: idSchema, stay: z.boolean().optional() }),
  async ({ promptId, stay }, user) => {
    if (!(await deletePrompt(db(), user.id, promptId))) throw notFound();
    updateTag(promptTag(promptId));
    if (stay) refresh();
    else redirect("/prompts");
  },
);

const answersSchema = z
  .array(z.object({ question: z.string().trim().max(120), answer: z.string().trim().max(120) }))
  .max(6)
  .default([]);

/**
 * Asks a few quick questions before enhancing (goal, audience, length...). Doesn't use an
 * enhancement from the daily quota; its small cost still counts toward the daily budget.
 * On any failure it returns no questions, so the user can still enhance straight away.
 */
export const clarifyAction = authedAction(
  z.object({ content: contentSchema }),
  async ({ content }, user) => {
    if (!(await withinBudget(db(), user.id, PLANS[user.plan].dailyBudgetUsd)))
      throw new UserError(BUDGET_MESSAGE);
    try {
      const result = await clarifyPrompt(content, {
        keys: openRouterKeys(),
        createModel: openRouterModel,
        userId: user.id,
      });
      await addCost(db(), user.id, result.costUsd);
      return { questions: result.questions.slice(0, 4) };
    } catch (error) {
      console.error("clarify failed", error);
      return { questions: [] };
    }
  },
  { rateLimit: "enhance" },
);

export const enhanceAction = authedAction(
  z.object({ content: contentSchema, answers: answersSchema }),
  async ({ content, answers }, user) => {
    const plan = PLANS[user.plan];
    if (!(await withinBudget(db(), user.id, plan.dailyBudgetUsd)))
      throw new UserError(BUDGET_MESSAGE);
    const limit = plan.enhancesPerDay;
    const quotaDay = await reserveQuota(db(), user.id, "enhances", limit);
    if (!quotaDay) {
      throw new UserError(`You've used all ${limit} enhancements for today.`);
    }
    try {
      const result = await enhancePrompt(content, {
        answers,
        keys: openRouterKeys(),
        createModel: openRouterModel,
        userId: user.id,
      });
      await recordCost(db(), user.id, result.costUsd, quotaDay);
      await touchStreak(db(), user.id);
      return { prompt: result.prompt, changes: result.changes };
    } catch (error) {
      await releaseQuota(db(), user.id, "enhances", quotaDay);
      console.error("enhance failed", error);
      throw new UserError("Couldn't enhance the prompt right now. Please try again.");
    }
  },
  { rateLimit: "enhance" },
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
