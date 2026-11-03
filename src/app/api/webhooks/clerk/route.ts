import type { UserJSON } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { deleteUser, upsertUserFromClerk } from "@/server/data/users";
import { env } from "@/server/env";

function primaryEmail(data: UserJSON) {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
  return (primary ?? data.email_addresses[0])?.email_address ?? "";
}

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req, { signingSecret: env().CLERK_WEBHOOK_SIGNING_SECRET });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const data = event.data;
      await upsertUserFromClerk(db(), {
        id: data.id,
        username: data.username,
        email: primaryEmail(data),
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
      });
      break;
    }
    case "user.deleted":
      if (event.data.id) await deleteUser(db(), event.data.id);
      break;
  }

  return new Response("ok");
}
