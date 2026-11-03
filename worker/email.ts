// Email worker: a separate long-running process (Vercel can't host it).
// Run with `npm run worker`; deploy on Railway/Render/Fly with the same env vars as the app.
import { existsSync } from "node:fs";
import { Worker } from "bullmq";
import { createDb } from "@/server/db/client";
import { processEmailJob, type EmailJob } from "@/server/email/jobs";
import { QUEUE_NAME } from "@/server/email/queue";
import { resendSender } from "@/server/email/send";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the email worker`);
  return value;
}

const deps = {
  db: createDb(required("DATABASE_URL")),
  send: resendSender(required("RESEND_API_KEY"), required("EMAIL_FROM")),
  appUrl: required("APP_URL").replace(/\/$/, ""),
  secret: required("UNSUBSCRIBE_SECRET"),
};

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const sent = await processEmailJob(deps, {
      id: job.id ?? job.name,
      name: job.name,
      data: job.data,
    } as EmailJob & { id: string });
    console.log(`[email] ${job.name} ${job.id}: sent ${sent}`);
    return sent;
  },
  { connection: { url: required("REDIS_URL") }, concurrency: 2 },
);

worker.on("failed", (job, err) =>
  console.error(
    `[email] ${job?.name} ${job?.id} failed (attempt ${job?.attemptsMade}):`,
    err.message,
  ),
);
console.log("[email] worker started");

async function shutdown() {
  console.log("[email] shutting down");
  await worker.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
