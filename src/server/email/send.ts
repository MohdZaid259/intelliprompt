import { Resend } from "resend";
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
        headers: {
          "List-Unsubscribe": `<${e.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      })),
      { idempotencyKey: key },
    );
    // throwing makes BullMQ retry the job; the idempotency key prevents duplicates
    if (error) throw new Error(`Resend batch failed: ${error.message}`);
  };
}
