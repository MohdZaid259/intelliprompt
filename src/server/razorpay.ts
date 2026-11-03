import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal Razorpay client: we only create orders and verify signatures, so no SDK.

export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? null };
}

export async function createRazorpayOrder(
  config: { keyId: string; keySecret: string },
  order: { amountPaise: number; currency: string; receipt: string; notes: Record<string, string> },
): Promise<{ id: string; amount: number; currency: string }> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.amountPaise,
      currency: order.currency,
      receipt: order.receipt.slice(0, 40),
      notes: order.notes,
    }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function hmacMatches(secret: string, payload: string, signature: string) {
  const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Checkout success callback: proves Razorpay paid this exact order with this payment. */
export function verifyCheckoutSignature(
  keySecret: string,
  p: { orderId: string; paymentId: string; signature: string },
) {
  return hmacMatches(keySecret, `${p.orderId}|${p.paymentId}`, p.signature);
}

/** Webhooks are signed over the raw request body. */
export function verifyWebhookSignature(webhookSecret: string, rawBody: string, signature: string) {
  return hmacMatches(webhookSecret, rawBody, signature);
}
