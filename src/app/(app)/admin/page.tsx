import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnnouncementForm } from "@/components/announcement-form";
import { ReviewModeration } from "@/components/reviews/review-moderation";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { listReviewsForAdmin } from "@/server/data/reviews";

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
  const reviews = await listReviewsForAdmin(db());
  const waiting = reviews.filter((r) => !r.approved).length;
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Send announcement</h1>
          <p className="text-muted-foreground text-sm">
            Emails everyone who opted in to news. Each email includes an unsubscribe link.
          </p>
        </div>
        <AnnouncementForm />
      </section>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Reviews{" "}
            {waiting > 0 && <span className="text-muted-foreground">({waiting} waiting)</span>}
          </h2>
          <p className="text-muted-foreground text-sm">
            Approved reviews show on the home page once there are at least 3.
          </p>
        </div>
        <ReviewModeration reviews={reviews} />
      </section>
    </div>
  );
}
