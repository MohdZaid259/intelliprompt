"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { enhancePrompt } from "@/server/ai/enhance";
import { openRouterKeys, openRouterModel } from "@/server/ai/client";
import { checkRateLimit } from "@/server/rate-limit";
import type { ActionResult } from "./safe-action";

/** Signed-out tries are short prompts; longer work belongs in an account. */
const TRY_MAX_CHARS = 1_500;

const input = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Write a rough idea first.")
    .max(TRY_MAX_CHARS, `Keep it under ${TRY_MAX_CHARS.toLocaleString()} characters to try it.`),
});

/** The visitor's IP as Vercel reports it. */
async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * One free enhance from the home page, no account needed, so people see the core feature
 * before signing up. Capped per visitor IP and for all visitors together, and refused
 * (not allowed through) if the limits can't be checked, since it spends real money.
 */
export async function tryEnhanceAction(
  raw: z.input<typeof input>,
): Promise<ActionResult<{ prompt: string; changes: string[] }>> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await clientIp();
  const perVisitor = await checkRateLimit("tryEnhanceIp", ip, undefined, undefined, true);
  if (!perVisitor.ok) {
    return { ok: false, error: "You've used your free tries. Sign up free to keep enhancing." };
  }
  const everyone = await checkRateLimit("tryEnhanceGlobal", "all", undefined, undefined, true);
  if (!everyone.ok) {
    return { ok: false, error: "Free tries are busy right now. Sign up free to keep enhancing." };
  }

  try {
    const result = await enhancePrompt(parsed.data.content, {
      keys: openRouterKeys(),
      createModel: openRouterModel,
    });
    return { ok: true, data: { prompt: result.prompt, changes: result.changes.slice(0, 4) } };
  } catch (error) {
    console.error("try enhance failed", error);
    return { ok: false, error: "Couldn't enhance it right now. Please try again." };
  }
}
