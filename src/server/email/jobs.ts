import { and, asc, eq, gt, ne } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { follows, prompts, users, versions } from "@/server/db/schema";
import { announcementEmail, newPromptEmail, type Email } from "./templates";
import { unsubscribeUrl, type EmailList } from "./unsubscribe";

// Job payloads. Kept tiny: the worker re-reads current data when it runs.
export type EmailJob =
  | { name: "notify-followers"; data: { promptId: string } }
  | { name: "announcement"; data: { subject: string; body: string } };

export type OutgoingEmail = Email & { to: string; unsubscribeUrl: string };

/** Sends one batch (≤ BATCH_SIZE). `key` is stable per batch so retries don't double send. */
export type SendBatch = (emails: OutgoingEmail[], key: string) => Promise<void>;

export type EmailDeps = { db: Db; send: SendBatch; appUrl: string; secret: string };

export const BATCH_SIZE = 100;

type Recipient = { id: string; email: string };

/** Walks recipients in id order, BATCH_SIZE at a time, so large lists never load at once. */
async function forEachBatch(
  fetchPage: (afterId: string) => Promise<Recipient[]>,
  handle: (batch: Recipient[], index: number) => Promise<void>,
) {
  let afterId = "";
  for (let index = 0; ; index++) {
    const batch = await fetchPage(afterId);
    if (batch.length === 0) return;
    await handle(batch, index);
    if (batch.length < BATCH_SIZE) return;
    afterId = batch[batch.length - 1].id;
  }
}

export async function notifyFollowers(deps: EmailDeps, promptId: string) {
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
    async (batch, index) => {
      await deps.send(
        batch.map((r) => {
          const unsub = link(deps, r.id, "follows");
          return {
            to: r.email,
            unsubscribeUrl: unsub,
            ...newPromptEmail({
              authorName: prompt.authorName || `@${prompt.username}`,
              title: prompt.title,
              preview: prompt.content.slice(0, 400),
              url: `${deps.appUrl}/p/${promptId}`,
              unsubscribeUrl: unsub,
            }),
          };
        }),
        `notify-${promptId}-${index}`,
      );
      sent += batch.length;
    },
  );
  return sent;
}

export async function sendAnnouncement(
  deps: EmailDeps,
  data: { subject: string; body: string },
  jobId: string,
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
    async (batch, index) => {
      await deps.send(
        batch.map((r) => {
          const unsub = link(deps, r.id, "newsletter");
          return {
            to: r.email,
            unsubscribeUrl: unsub,
            ...announcementEmail({ ...data, unsubscribeUrl: unsub }),
          };
        }),
        `announce-${jobId}-${index}`,
      );
      sent += batch.length;
    },
  );
  return sent;
}

const link = (deps: EmailDeps, userId: string, list: EmailList) =>
  unsubscribeUrl(deps.appUrl, deps.secret, userId, list);

export async function processEmailJob(deps: EmailDeps, job: EmailJob & { id: string }) {
  switch (job.name) {
    case "notify-followers":
      return notifyFollowers(deps, job.data.promptId);
    case "announcement":
      return sendAnnouncement(deps, job.data, job.id);
  }
}
