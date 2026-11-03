"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useGoToSignIn } from "@/components/community/sign-in-redirect";
import { Button } from "@/components/ui/button";
import type { PassKey } from "@/config/plans";
import {
  createOrderAction,
  paymentFailedAction,
  verifyPaymentAction,
} from "@/server/actions/billing";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: () => void): void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Razorpay"));
    document.body.appendChild(script);
  });
}

export function BuyButton({
  passKey,
  label,
  signedIn,
  variant = "default",
}: {
  passKey: PassKey;
  label: string;
  signedIn: boolean;
  variant?: "default" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);
  const goToSignIn = useGoToSignIn();

  const buy = () => {
    if (!signedIn) return goToSignIn();
    startTransition(async () => {
      try {
        const [order] = await Promise.all([createOrderAction({ passKey }), loadCheckout()]);
        if (!order.ok) return void toast.error(order.error);
        const { keyId, orderId, amountPaise, currency, description, prefill } = order.data;

        setPaying(true);
        const checkout = new window.Razorpay!({
          key: keyId,
          order_id: orderId,
          amount: amountPaise,
          currency,
          name: "IntelliPrompt",
          description,
          prefill,
          theme: { color: "#aa44ff" },
          handler: async (res: RazorpaySuccess) => {
            const result = await verifyPaymentAction({
              orderId: res.razorpay_order_id,
              paymentId: res.razorpay_payment_id,
              signature: res.razorpay_signature,
            });
            setPaying(false);
            if (result.ok) toast.success("You're on Pro. Thank you!");
            else toast.error(result.error);
          },
          modal: { ondismiss: () => setPaying(false) },
        });
        checkout.on("payment.failed", () => {
          setPaying(false);
          void paymentFailedAction({ orderId });
          toast.error("Payment failed. You haven't been charged for this attempt.");
        });
        checkout.open();
      } catch {
        setPaying(false);
        toast.error("Couldn't start the payment. Please try again.");
      }
    });
  };

  return (
    <Button onClick={buy} disabled={pending || paying} variant={variant} className="w-full">
      {(pending || paying) && <Loader2 className="animate-spin" />} {label}
    </Button>
  );
}
