import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedList, FeedSkeletonGrid } from "@/components/community/feed-list";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage({ searchParams }: PageProps<"/saved">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Saved prompts</h1>
      <Suspense fallback={<FeedSkeletonGrid />}>
        <Saved searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Saved({ searchParams }: { searchParams: PageProps<"/saved">["searchParams"] }) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const page = Math.max(1, Number(query.page) || 1);
  return (
    <FeedList
      viewerId={user.id}
      options={{ savedBy: user.id }}
      page={page}
      pageHref={(p) => (p > 1 ? `/saved?page=${p}` : "/saved")}
      empty={
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Nothing saved yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tap the bookmark on any prompt in Explore to keep it here.
          </p>
        </div>
      }
    />
  );
}
