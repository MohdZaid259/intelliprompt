import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";

const sign = (secret: string, payload: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

describe("Razorpay signatures", () => {
  it("accepts a valid checkout signature and rejects tampering", () => {
    const signature = sign("secret", "order_1|pay_1");
    expect(
      verifyCheckoutSignature("secret", { orderId: "order_1", paymentId: "pay_1", signature }),
    ).toBe(true);
    // the same signature can't be replayed for another order or payment
    expect(
      verifyCheckoutSignature("secret", { orderId: "order_2", paymentId: "pay_1", signature }),
    ).toBe(false);
    expect(
      verifyCheckoutSignature("secret", { orderId: "order_1", paymentId: "pay_2", signature }),
    ).toBe(false);
    expect(
      verifyCheckoutSignature("other", { orderId: "order_1", paymentId: "pay_1", signature }),
    ).toBe(false);
    expect(
      verifyCheckoutSignature("secret", { orderId: "order_1", paymentId: "pay_1", signature: "x" }),
    ).toBe(false);
  });

  it("verifies webhooks over the exact raw body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = sign("whsec", body);
    expect(verifyWebhookSignature("whsec", body, signature)).toBe(true);
    expect(verifyWebhookSignature("whsec", body + " ", signature)).toBe(false);
  });
});
