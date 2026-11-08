import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, SupportEmail } from "@/components/legal/legal-page";
import { PASSES, formatRupees } from "@/config/plans";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "How Pro passes, cancellations and refunds work on IntelliPrompt.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro="Pro is sold as a one-time pass, not a subscription. Here is what that means for cancelling and refunds."
    >
      <h2>1. How Pro passes work</h2>
      <ul>
        {Object.values(PASSES).map((p) => (
          <li key={p.label}>
            {p.label}: a single payment of {formatRupees(p.amountPaise)} for {p.days} days of Pro.
          </li>
        ))}
        <li>Passes do not renew automatically. You are charged only when you choose to buy one.</li>
        <li>
          Buying another pass while Pro is active adds its days to the end of your current pass.
        </li>
      </ul>

      <h2>2. Cancellation</h2>
      <p>
        Because there is no recurring billing, there is nothing to cancel: you will never be charged
        again unless you buy another pass. Your Pro access continues until the end of the period you
        paid for, then your account returns to the Free plan with all your prompts kept. You can
        check when your pass ends on the <Link href="/billing">Billing</Link> page.
      </p>

      <h2>3. Refunds</h2>
      <p>
        Pro starts as soon as payment succeeds, so passes are generally{" "}
        <strong>non-refundable</strong>, including for unused days. We will give a full refund if:
      </p>
      <ul>
        <li>you were charged more than once for the same purchase;</li>
        <li>you were charged but Pro was not added to your account, and we can&apos;t fix it;</li>
        <li>a fault on our side made Pro features unavailable for most of your pass.</li>
      </ul>
      <p>
        If we close your account without you breaking our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>, we refund the unused part of your pass.
        Other requests are considered case by case.
      </p>

      <h2>4. How to request a refund</h2>
      <p>
        Email <SupportEmail /> within 7 days of the payment, from the email address on your account.
        Include the date, the amount and the Razorpay payment ID from your receipt, and tell us what
        went wrong.
      </p>

      <h2>5. Processing time</h2>
      <p>
        We reply within 2 business days. Approved refunds are issued through Razorpay to the
        original payment method within 5–7 business days; your bank may take a few more days to show
        it. When a refund is issued, the Pro days it covers are removed from your account.
      </p>

      <h2>6. Failed payments</h2>
      <p>
        If money left your account but the payment failed, Razorpay normally returns it to you
        automatically within 5–7 business days. If it hasn&apos;t arrived after that, contact us
        with the payment details.
      </p>
    </LegalPage>
  );
}
