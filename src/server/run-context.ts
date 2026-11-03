import "server-only";
import { canUseModel, MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";
import { getActiveModelIds } from "@/server/ai/models";
import type { SessionUser } from "@/server/auth";
import { db } from "@/server/db";
import { getUsage } from "@/server/quota";

/** The models a user can pick (locked ones shown greyed out) and their limits for today. */
export async function getRunContext(user: SessionUser) {
  const plan = PLANS[user.plan];
  const [activeIds, usage] = await Promise.all([getActiveModelIds(), getUsage(db(), user.id)]);
  return {
    models: MODELS.filter((m) => activeIds.includes(m.id)).map((m) => ({
      ...m,
      locked: !canUseModel(m, plan.modelTier),
    })),
    limits: { runsPerDay: plan.runsPerDay, runsUsed: usage.runs, maxTokens: plan.maxTokens },
  };
}
