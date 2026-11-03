import "server-only";
import { eq } from "drizzle-orm";
import type { Db } from "@/server/db/types";
import { users } from "@/server/db/schema";
import { deriveUsername, withSuffix } from "@/lib/username";

// The fields we keep from Clerk, normalized from either the webhook payload or currentUser().
export type ClerkProfile = {
  id: string;
  username: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
};

const UNIQUE_VIOLATION = "23505";

function isUsernameTaken(err: unknown) {
  // drizzle wraps driver errors in `cause`; postgres-js says constraint_name, PGlite says constraint
  type PgError = { code?: string; constraint_name?: string; constraint?: string };
  const e = ((err as { cause?: PgError }).cause ?? err) as PgError;
  const code = e.code;
  const constraint = e.constraint_name ?? e.constraint ?? "";
  return code === UNIQUE_VIOLATION && constraint.includes("username");
}

export async function upsertUserFromClerk(db: Db, profile: ClerkProfile) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const base = deriveUsername(profile.username, profile.email);

  for (let attempt = 0; attempt < 4; attempt++) {
    const username = attempt === 0 ? base : withSuffix(base);
    try {
      const [row] = await db
        .insert(users)
        .values({
          id: profile.id,
          username,
          name,
          email: profile.email,
          avatarUrl: profile.imageUrl,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name,
            email: profile.email,
            avatarUrl: profile.imageUrl,
            // only follow Clerk's username when the user explicitly set one there
            ...(profile.username ? { username } : {}),
          },
        })
        .returning();
      return row;
    } catch (err) {
      if (!isUsernameTaken(err)) throw err;
    }
  }
  throw new Error(`Could not assign a unique username for user ${profile.id}`);
}

export async function deleteUser(db: Db, id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function findUserById(db: Db, id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
