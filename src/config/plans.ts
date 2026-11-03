// Single source of truth for plan limits (prices are added with billing in Milestone 3b).
export type PlanKey = "free" | "pro";

export const PLANS = {
  free: { label: "Free", runsPerDay: 20, enhancesPerDay: 5, maxTokens: 1024, modelTier: "free" },
  pro: { label: "Pro", runsPerDay: 300, enhancesPerDay: 100, maxTokens: 4096, modelTier: "pro" },
} as const satisfies Record<
  PlanKey,
  {
    label: string;
    runsPerDay: number;
    enhancesPerDay: number;
    maxTokens: number;
    modelTier: "free" | "pro";
  }
>;

/** Pro only counts while it hasn't expired. */
export function effectivePlan(user: { plan: PlanKey; planExpiresAt: Date | null }): PlanKey {
  return user.plan === "pro" && user.planExpiresAt && user.planExpiresAt > new Date()
    ? "pro"
    : "free";
}
