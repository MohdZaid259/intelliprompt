import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { isPassKey, PASSES, type PassKey } from "@/config/plans";
import type { Db } from "@/server/db/types";
import { payments, users } from "@/server/db/schema";

export async function recordOrder(
  db: Db,
  order: { userId: string; orderId: string; passKey: PassKey },
) {
  const pass = PASSES[order.passKey];
  await db.insert(payments).values({
    userId: order.userId,
    razorpayOrderId: order.orderId,
    planKey: order.passKey,
    amountPaise: pass.amountPaise,
    currency: pass.currency,
  });
}

export type FulfillResult =
  | { status: "fulfilled" | "already_paid"; userId: string; planExpiresAt: Date | null }
  | { status: "not_found" | "amount_mismatch" };

/**
 * Marks an order paid and extends Pro. Idempotent: the browser callback and the webhook
 * both call this, and whichever comes second is a no-op. Days are added on top of any
 * remaining Pro time.
 */
export async function fulfillPayment(
  db: Db,
  p: { orderId: string; paymentId: string; userId?: string; amountPaise?: number },
): Promise<FulfillResult> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.razorpayOrderId, p.orderId),
          p.userId ? eq(payments.userId, p.userId) : undefined,
        ),
      )
      .for("update");
    // userId is null once the buyer deleted their account; nothing to grant then
    if (!order || !order.userId || !isPassKey(order.planKey)) return { status: "not_found" };
    const userId = order.userId;

    if (order.status === "paid") {
      const [user] = await tx
        .select({ planExpiresAt: users.planExpiresAt })
        .from(users)
        .where(eq(users.id, userId));
      return { status: "already_paid", userId, planExpiresAt: user?.planExpiresAt ?? null };
    }
    if (p.amountPaise !== undefined && p.amountPaise !== order.amountPaise) {
      return { status: "amount_mismatch" };
    }

    await tx
      .update(payments)
      .set({ status: "paid", razorpayPaymentId: p.paymentId })
      .where(eq(payments.id, order.id));

    const days = PASSES[order.planKey].days;
    const [user] = await tx
      .update(users)
      .set({
        plan: "pro",
        planExpiresAt: sql`greatest(coalesce(${users.planExpiresAt}, now()), now()) + make_interval(days => ${days})`,
      })
      .where(eq(users.id, userId))
      .returning({ planExpiresAt: users.planExpiresAt });

    return { status: "fulfilled", userId, planExpiresAt: user.planExpiresAt };
  });
}

/** Only orders still waiting for payment can fail; pass userId to restrict to the buyer. */
export async function markPaymentFailed(db: Db, orderId: string, userId?: string) {
  await db
    .update(payments)
    .set({ status: "failed" })
    .where(
      and(
        eq(payments.razorpayOrderId, orderId),
        eq(payments.status, "created"),
        userId ? eq(payments.userId, userId) : undefined,
      ),
    );
}

export async function listPayments(db: Db, userId: string) {
  return db
    .select({
      id: payments.id,
      planKey: payments.planKey,
      amountPaise: payments.amountPaise,
      currency: payments.currency,
      status: payments.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(50);
}
