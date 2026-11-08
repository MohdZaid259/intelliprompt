import "server-only";
import { enqueueEmail } from "@/server/email/queue";

/** Queues the welcome email for an account that was just created. Never blocks sign-up. */
export async function welcomeIfNew(user: { id: string; email: string; created: boolean }) {
  if (!user.created || !user.email) return;
  try {
    // same jobId if the webhook and the first page load both create the row: queued once
    await enqueueEmail(
      { name: "welcome", data: { userId: user.id } },
      { jobId: `welcome-${user.id}` },
    );
  } catch (err) {
    console.error("[welcome] could not queue email", err);
  }
}
