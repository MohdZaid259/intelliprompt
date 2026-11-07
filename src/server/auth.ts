import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db";
import { findUserById, upsertUserFromClerk } from "@/server/data/users";
import type { users } from "@/server/db/schema";
import { effectivePlan, type PlanKey } from "@/config/plans";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  /** Effective plan: an expired Pro counts as free. */
  plan: PlanKey;
  role: "user" | "admin";
};

function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  const { id, username, name, avatarUrl, role } = row;
  return { id, username, name, avatarUrl, role, plan: effectivePlan(row) };
}

/**
 * The signed-in user, or null. Creates the DB row on first sight if the webhook hasn't yet.
 * Cached per request, so the shell and the page share one lookup.
 */
export const getUser = cache(async function getUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await findUserById(db(), userId);
  if (existing) return toSessionUser(existing);

  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  const created = await upsertUserFromClerk(db(), {
    id: clerkUser.id,
    username: clerkUser.username,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  });
  return toSessionUser(created);
});

/** Use in every server action / private page. Redirects to sign-in when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
