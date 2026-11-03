import { db } from "@/server/db";
import { fulfillPayment, markPaymentFailed } from "@/server/data/billing";
import { razorpayConfig, verifyWebhookSignature } from "@/server/razorpay";

type PaymentEntity = { id: string; order_id: string; amount: number; status: string };
type WebhookBody = { event: string; payload?: { payment?: { entity?: PaymentEntity } } };

/**
 * Backup for the browser flow (e.g. the tab closed after paying). Configure in the Razorpay
 * dashboard with events payment.captured and payment.failed.
 */
export async function POST(req: Request) {
  const secret = razorpayConfig()?.webhookSecret;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(secret, raw, signature)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const body = JSON.parse(raw) as WebhookBody;
  const payment = body.payload?.payment?.entity;
  if (!payment?.order_id) return new Response("ignored");

  if (body.event === "payment.captured") {
    const result = await fulfillPayment(db(), {
      orderId: payment.order_id,
      paymentId: payment.id,
      amountPaise: payment.amount,
    });
    if (result.status === "amount_mismatch") {
      console.error("[razorpay] amount mismatch", payment.order_id, payment.amount);
    }
  } else if (body.event === "payment.failed") {
    await markPaymentFailed(db(), payment.order_id);
  }
  // 200 for everything we verified, so Razorpay doesn't retry events we chose to ignore
  return new Response("ok");
}
