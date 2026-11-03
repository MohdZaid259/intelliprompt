"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { PASSES } from "@/config/plans";
import { db } from "@/server/db";
import { fulfillPayment, markPaymentFailed, recordOrder } from "@/server/data/billing";
import { findUserById } from "@/server/data/users";
import { createRazorpayOrder, razorpayConfig, verifyCheckoutSignature } from "@/server/razorpay";
import { authedAction, UserError } from "./safe-action";

function config() {
  const c = razorpayConfig();
  if (!c) throw new UserError("Payments aren't set up yet. Please try again later.");
  return c;
}

/** Creates a Razorpay order for a pass. The amount always comes from config, never the client. */
export const createOrderAction = authedAction(
  z.object({ passKey: z.enum(["pro_month", "pro_year"]) }),
  async ({ passKey }, user) => {
    const c = config();
    const pass = PASSES[passKey];
    const order = await createRazorpayOrder(c, {
      amountPaise: pass.amountPaise,
      currency: pass.currency,
      receipt: `${passKey}_${user.id.slice(-12)}_${Date.now()}`,
      notes: { userId: user.id, passKey },
    });
    await recordOrder(db(), { userId: user.id, orderId: order.id, passKey });

    const me = await findUserById(db(), user.id);
    return {
      keyId: c.keyId,
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      description: pass.label,
      prefill: { name: me?.name ?? "", email: me?.email ?? "" },
    };
  },
);

/** Checkout success callback: verify Razorpay's signature, then grant Pro (idempotent). */
export const verifyPaymentAction = authedAction(
  z.object({
    orderId: z.string().min(1),
    paymentId: z.string().min(1),
    signature: z.string().min(1),
  }),
  async ({ orderId, paymentId, signature }, user) => {
    const c = config();
    if (!verifyCheckoutSignature(c.keySecret, { orderId, paymentId, signature })) {
      throw new UserError("We couldn't verify this payment. If you were charged, contact support.");
    }
    const result = await fulfillPayment(db(), { orderId, paymentId, userId: user.id });
    if (result.status !== "fulfilled" && result.status !== "already_paid") {
      throw new UserError("We couldn't match this payment to your order. Contact support.");
    }
    refresh();
    return { planExpiresAt: result.planExpiresAt };
  },
);

export const paymentFailedAction = authedAction(
  z.object({ orderId: z.string().min(1) }),
  async ({ orderId }, user) => {
    await markPaymentFailed(db(), orderId, user.id);
  },
);
