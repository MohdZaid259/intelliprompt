import { db } from "@/server/db";
import { unsubscribe } from "@/server/data/users";
import { verifyUnsubscribe } from "@/server/email/unsubscribe";

/** Mail clients that open the List-Unsubscribe link with GET get the confirmation page. */
export function GET(req: Request) {
  const url = new URL(req.url);
  return Response.redirect(new URL(`/unsubscribe${url.search}`, url), 303);
}

/**
 * Handles both the unsubscribe page's form and mail clients' one-click
 * (RFC 8058 List-Unsubscribe-Post), which POSTs to the link with the params in the URL.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const field = (k: string) => url.searchParams.get(k) ?? (form?.get(k) as string | null) ?? null;

  const secret = process.env.UNSUBSCRIBE_SECRET;
  const target = secret
    ? verifyUnsubscribe(secret, { u: field("u"), l: field("l"), t: field("t") })
    : null;
  if (!target) return new Response("Invalid unsubscribe link", { status: 400 });

  await unsubscribe(db(), target.userId, target.list);

  // one-click requests come from the mail client, not a browser
  if (form?.get("List-Unsubscribe") === "One-Click") return new Response("Unsubscribed");
  return Response.redirect(new URL(`/unsubscribe?done=${target.list}`, url), 303);
}
