import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SettingsForm } from "@/components/settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { getSettings } from "@/server/data/users";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const user = await requireUser();
  const settings = await getSettings(db(), user.id);
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Name and photo come from your account (avatar menu → Manage account). Your public profile is
        at{" "}
        <Link href={`/u/${user.username}`} className="underline">
          /u/{user.username}
        </Link>
        .
      </p>
      {settings && <SettingsForm initial={settings} />}
    </div>
  );
}
