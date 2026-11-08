import { createHash } from "node:crypto";
import { and, asc, eq, gt, ne } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { follows, prompts, users, versions } from "@/server/db/schema";
import { announcementEmail, newPromptEmail, type Email } from "./templates";
import { unsubscribeLinks, type EmailList } from "./unsubscribe";

// Job payloads. Kept tiny: the worker re-reads current data when it runs.
export type EmailJob =
  | { name: "notify-followers"; data: { promptId: string } }
  | { name: "announcement"; data: { subject: string; body: string } };

export type OutgoingEmail = Email & { to: string; oneClickUnsubscribeUrl: string };

/** Sends one batch (≤ BATCH_SIZE). Same recipients → same key, so a retried batch isn't re-sent. */
export type SendBatch = (emails: OutgoingEmail[], key: string) => Promise<void>;

export type EmailDeps = { db: Db; send: SendBatch; appUrl: string; secret: string };

/**
 * Where a job resumes on retry: batches up to `cursor` (a recipient id) were already sent.
 * The worker stores it in the job's data after each batch.
 */
export type Progress = { cursor?: string; onBatchSent?: (cursor: string) => Promise<unknown> };

export const BATCH_SIZE = 100;

type Recipient = { id: string; email: string };

/** Walks recipients in id order, BATCH_SIZE at a time, so large lists never load at once. */
async function forEachBatch(
  fetchPage: (afterId: string) => Promise<Recipient[]>,
  handle: (batch: Recipient[], key: string) => Promise<void>,
  progress: Progress,
) {
  let afterId = progress.cursor ?? "";
  for (;;) {
    const batch = await fetchPage(afterId);
    if (batch.length === 0) return;
    await handle(batch, recipientsHash(batch));
    afterId = batch[batch.length - 1].id;
    await progress.onBatchSent?.(afterId);
    if (batch.length < BATCH_SIZE) return;
  }
}

const recipientsHash = (batch: Recipient[]) =>
  createHash("sha256")
    .update(batch.map((r) => r.id).join(","))
    .digest("base64url")
    .slice(0, 16);

export async function notifyFollowers(deps: EmailDeps, promptId: string, progress: Progress = {}) {
  const { db } = deps;
  const [prompt] = await db
    .select({
      title: prompts.title,
      ownerId: prompts.ownerId,
      authorName: users.name,
      username: users.username,
      content: versions.content,
    })
    .from(prompts)
    .innerJoin(users, eq(users.id, prompts.ownerId))
    .innerJoin(versions, eq(versions.id, prompts.bestVersionId))
    .where(and(eq(prompts.id, promptId), eq(prompts.visibility, "public")));
  if (!prompt) return 0; // unpublished or deleted since the job was queued

  let sent = 0;
  await forEachBatch(
    (afterId) =>
      db
        .select({ id: users.id, email: users.email })
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followerId))
        .where(
          and(
            eq(follows.followeeId, prompt.ownerId),
            eq(users.followUpdates, true),
            ne(users.email, ""),
            gt(users.id, afterId),
          ),
        )
        .orderBy(asc(users.id))
        .limit(BATCH_SIZE),
    async (batch, key) => {
      await deps.send(
        batch.map((r) => {
          const unsub = links(deps, r.id, "follows");
          return {
            to: r.email,
            oneClickUnsubscribeUrl: unsub.oneClick,
            ...newPromptEmail({
              appUrl: deps.appUrl,
              authorName: prompt.authorName || `@${prompt.username}`,
              title: prompt.title,
              preview: prompt.content.slice(0, 400),
              url: `${deps.appUrl}/p/${promptId}`,
              unsubscribeUrl: unsub.page,
            }),
          };
        }),
        `notify-${promptId}-${key}`,
      );
      sent += batch.length;
    },
    progress,
  );
  return sent;
}

export async function sendAnnouncement(
  deps: EmailDeps,
  data: { subject: string; body: string },
  jobId: string,
  progress: Progress = {},
) {
  let sent = 0;
  await forEachBatch(
    (afterId) =>
      deps.db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(and(eq(users.newsletter, true), ne(users.email, ""), gt(users.id, afterId)))
        .orderBy(asc(users.id))
        .limit(BATCH_SIZE),
    async (batch, key) => {
      await deps.send(
        batch.map((r) => {
          const unsub = links(deps, r.id, "newsletter");
          return {
            to: r.email,
            oneClickUnsubscribeUrl: unsub.oneClick,
            ...announcementEmail({ ...data, appUrl: deps.appUrl, unsubscribeUrl: unsub.page }),
          };
        }),
        `announce-${jobId}-${key}`,
      );
      sent += batch.length;
    },
    progress,
  );
  return sent;
}

const links = (deps: EmailDeps, userId: string, list: EmailList) =>
  unsubscribeLinks(deps.appUrl, deps.secret, userId, list);

export async function processEmailJob(
  deps: EmailDeps,
  job: EmailJob & { id: string },
  progress: Progress = {},
) {
  switch (job.name) {
    case "notify-followers":
      return notifyFollowers(deps, job.data.promptId, progress);
    case "announcement":
      return sendAnnouncement(deps, job.data, job.id, progress);
  }
}
