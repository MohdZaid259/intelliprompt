// Single source of truth for plan limits and prices. The server never takes a price from the client.
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
