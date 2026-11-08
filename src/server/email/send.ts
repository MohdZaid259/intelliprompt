import { Resend } from "resend";
import { LEGAL } from "@/config/legal";
import type { SendBatch } from "./jobs";

/** Sends through Resend's batch API with one-click unsubscribe headers. */
export function resendSender(apiKey: string, from: string): SendBatch {
  const resend = new Resend(apiKey);
  return async (emails, key) => {
    const { error } = await resend.batch.send(
      emails.map((e) => ({
        from,
        to: e.to,
        subject: e.subject,
        html: e.html,
        text: e.text,
        replyTo: LEGAL.email,
        // transactional emails (welcome) have no unsubscribe link
        headers: e.oneClickUnsubscribeUrl
          ? {
              "List-Unsubscribe": `<${e.oneClickUnsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }
          : undefined,
      })),
      { idempotencyKey: key },
    );
    // throwing makes BullMQ retry the job; the idempotency key prevents duplicates
    if (error) throw new Error(`Resend batch failed: ${error.message}`);
  };
}
