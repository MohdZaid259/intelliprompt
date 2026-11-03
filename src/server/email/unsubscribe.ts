import { createHmac, timingSafeEqual } from "node:crypto";

// Which email list a link unsubscribes from.
export type EmailList = "newsletter" | "follows";

function signature(secret: string, userId: string, list: EmailList) {
  return createHmac("sha256", secret).update(`${userId}:${list}`).digest("base64url");
}

/**
 * Unsubscribe links that work without signing in; the HMAC stops people unsubscribing others.
 * `page` is the confirmation page for the email body; `oneClick` is the endpoint mail clients
 * POST to from the List-Unsubscribe header (RFC 8058).
 */
export function unsubscribeLinks(appUrl: string, secret: string, userId: string, list: EmailList) {
  const q = new URLSearchParams({ u: userId, l: list, t: signature(secret, userId, list) });
  const base = appUrl.replace(/\/$/, "");
  return { page: `${base}/unsubscribe?${q}`, oneClick: `${base}/api/unsubscribe?${q}` };
}

export function verifyUnsubscribe(
  secret: string,
  params: { u?: string | null; l?: string | null; t?: string | null },
): { userId: string; list: EmailList } | null {
  const { u, l, t } = params;
  if (!u || !t || (l !== "newsletter" && l !== "follows")) return null;
  const expected = Buffer.from(signature(secret, u, l));
  const given = Buffer.from(t);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { userId: u, list: l };
}
