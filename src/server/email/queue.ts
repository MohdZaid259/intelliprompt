import { Queue } from "bullmq";
import type { EmailJob } from "./jobs";

export const QUEUE_NAME = "email";

const globalForQueue = globalThis as unknown as { emailQueue?: Queue };

function queue(): Queue | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  globalForQueue.emailQueue ??= new Queue(QUEUE_NAME, {
    connection: { url },
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  return globalForQueue.emailQueue;
}

/**
 * Adds an email job. Without REDIS_URL (e.g. local dev) emails are skipped with a log line,
 * so the app keeps working before email is set up.
 */
export async function enqueueEmail(job: EmailJob, opts: { jobId?: string } = {}) {
  const q = queue();
  if (!q) {
    console.warn(`[email] REDIS_URL not set, skipping "${job.name}" job`);
    return;
  }
  await q.add(job.name, job.data, { jobId: opts.jobId });
}
