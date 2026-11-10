"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { updateSettings } from "@/server/data/users";
import { enqueueEmail } from "@/server/email/queue";
import { authedAction, UserError } from "./safe-action";

export const updateSettingsAction = authedAction(
  z.object({
    bio: z.string().trim().max(160, "Bio can be at most 160 characters"),
    newsletter: z.boolean(),
    followUpdates: z.boolean(),
  }),
  async (settings, user) => {
    await updateSettings(db(), user.id, settings);
    refresh();
  },
);

export const sendAnnouncementAction = authedAction(
  z.object({
    subject: z.string().trim().min(3, "Add a subject").max(120),
    body: z.string().trim().min(10, "Write the announcement").max(5000),
  }),
  async (data, user) => {
    if (user.role !== "admin") throw new UserError("Only admins can send announcements.");
    if (!process.env.REDIS_URL) throw new UserError("Email queue isn't configured (REDIS_URL).");
    try {
      await enqueueEmail({ name: "announcement", data }, { jobId: randomUUID() });
    } catch (err) {
      console.error("[email] couldn't queue announcement:", err);
      throw new UserError("Couldn't reach the email queue. Nothing was sent. Try again shortly.");
    }
  },
  { rateLimit: "announce" },
);
