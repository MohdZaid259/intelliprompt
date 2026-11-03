import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnnouncementForm } from "@/components/announcement-form";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense>
      <Admin />
    </Suspense>
  );
}

async function Admin() {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Send announcement</h1>
        <p className="text-muted-foreground text-sm">
          Emails everyone who opted in to news. Each email includes an unsubscribe link.
        </p>
      </div>
      <AnnouncementForm />
    </div>
  );
}
