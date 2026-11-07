// Single source of truth for plan limits and prices. The server never takes a price from the client.
export type PlanKey = "free" | "pro";

// dailyBudgetUsd caps what one user's AI calls can cost per day (model prices vary ~100x,
// so run counts alone don't bound cost). Pro's cap keeps a heavy user under the pass price.
export const PLANS = {
  free: {
    label: "Free",
    runsPerDay: 20,
    enhancesPerDay: 5,
    maxTokens: 2048,
    modelTier: "free",
    dailyBudgetUsd: 0.03,
  },
  pro: {
    label: "Pro",
    runsPerDay: 300,
    enhancesPerDay: 100,
    maxTokens: 4096,
    modelTier: "pro",
    dailyBudgetUsd: 0.15,
  },
} as const satisfies Record<
  PlanKey,
  {
    label: string;
    runsPerDay: number;
    enhancesPerDay: number;
    maxTokens: number;
    modelTier: "free" | "pro";
    dailyBudgetUsd: number;
  }
>;

export const BUDGET_MESSAGE = "You've reached today's fair-use AI budget. It resets at 00:00 UTC.";

/** Pro only counts while it hasn't expired. */
export function effectivePlan(user: { plan: PlanKey; planExpiresAt: Date | null }): PlanKey {
  return user.plan === "pro" && user.planExpiresAt && user.planExpiresAt > new Date()
    ? "pro"
    : "free";
}

/**
 * Pro is sold as one-time passes (no auto-renew). Buying again extends from the current expiry.
 * Amounts are in paise (₹1 = 100 paise), as Razorpay expects.
 */
export const PASSES = {
  pro_month: {
    label: "Pro · 30 days",
    plan: "pro",
    days: 30,
    amountPaise: 499_00,
    currency: "INR",
  },
  pro_year: {
    label: "Pro · 365 days",
    plan: "pro",
    days: 365,
    amountPaise: 4_999_00,
    currency: "INR",
  },
} as const;

export type PassKey = keyof typeof PASSES;

export function isPassKey(key: string): key is PassKey {
  return key in PASSES;
}

export function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
