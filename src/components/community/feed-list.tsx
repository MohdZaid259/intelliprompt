import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { getViewerFlags, listPublicPrompts, type FeedOptions } from "@/server/data/community";
import { PromptCard } from "./prompt-card";

const PAGE_SIZE = 24;

/** Server component: a grid of public prompts for the given filters, with paging links. */
export async function FeedList({
  options,
  viewerId,
  empty,
  page = 1,
  pageHref,
}: {
  options: Omit<FeedOptions, "limit" | "offset">;
  viewerId: string | null;
  empty: React.ReactNode;
  page?: number;
  pageHref?: (page: number) => string;
}) {
  // fetch one extra row to know whether there's a next page
  const rows = await listPublicPrompts(db(), {
    ...options,
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  });
  const items = rows.slice(0, PAGE_SIZE);
  if (items.length === 0 && page === 1) return <>{empty}</>;

  const flags = await getViewerFlags(
    db(),
    viewerId,
    items.map((i) => i.id),
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <PromptCard
            key={item.id}
            item={item}
            liked={flags.liked.has(item.id)}
            saved={flags.saved.has(item.id)}
            signedIn={!!viewerId}
          />
        ))}
      </div>
      {pageHref && (page > 1 || rows.length > PAGE_SIZE) && (
        <div className="flex justify-between">
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={pageHref(page - 1)}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          {rows.length > PAGE_SIZE && (
            <Button asChild variant="outline">
              <Link href={pageHref(page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function FeedSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="bg-muted/50 h-48 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}
