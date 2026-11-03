import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { requireUser, type SessionUser } from "@/server/auth";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** An error whose message is safe to show to the user. */
export class UserError extends Error {}

/**
 * Wraps a server action: requires a signed-in user, validates input with zod, and turns
 * failures into `{ ok: false, error }` so client code never sees internals.
 */
export function authedAction<S extends z.ZodType, T>(
  schema: S,
  fn: (input: z.infer<S>, user: SessionUser) => Promise<T>,
) {
  return async (raw: z.input<S>): Promise<ActionResult<T>> => {
    const user = await requireUser();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    try {
      return { ok: true, data: await fn(parsed.data, user) };
    } catch (error) {
      unstable_rethrow(error); // let redirect()/notFound() through
      if (error instanceof UserError) return { ok: false, error: error.message };
      console.error(error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}
