"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { idSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { deleteReview, REVIEWS_TAG, setReviewApproved, upsertReview } from "@/server/data/reviews";
import { authedAction, UserError } from "./safe-action";

export const submitReviewAction = authedAction(
  z.object({
    rating: z.number().int().min(1, "Pick a rating").max(5),
    body: z
      .string()
      .trim()
      .min(20, "Write at least 20 characters")
      .max(500, "Keep it under 500 characters"),
    headline: z.string().trim().max(60, "Keep it under 60 characters"),
  }),
  async (input, user) => {
    await upsertReview(db(), user.id, input);
    updateTag(REVIEWS_TAG); // an edited review leaves the landing page until re-approved
    refresh();
  },
);

export const moderateReviewAction = authedAction(
  z.object({ id: idSchema, action: z.enum(["approve", "hide", "delete"]) }),
  async ({ id, action }, user) => {
    if (user.role !== "admin") throw new UserError("Only admins can moderate reviews.");
    if (action === "delete") await deleteReview(db(), id);
    else await setReviewApproved(db(), id, action === "approve");
    updateTag(REVIEWS_TAG);
    refresh();
  },
);
