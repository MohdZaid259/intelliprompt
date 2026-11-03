import { X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FeedList, FeedSkeletonGrid } from "@/components/community/feed-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover prompts the community has tested across models.",
};

const TABS = [
  { key: "new", label: "Latest" },
  { key: "top", label: "Top this week" },
  { key: "following", label: "Following" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
      <Suspense fallback={<FeedSkeletonGrid />}>
        <Explore searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Explore({ searchParams }: { searchParams: PageProps<"/explore">["searchParams"] }) {
  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === one(params.sort)) ? (one(params.sort) as Tab) : "new";
  const tag = one(params.tag)?.toLowerCase();
  const page = Math.max(1, Number(one(params.page)) || 1);
  const viewer = await getUser();

  const href = (next: { sort?: Tab; tag?: string | null; page?: number }) => {
    const q = new URLSearchParams();
    const sort = next.sort ?? tab;
    const t = next.tag === undefined ? tag : next.tag;
    if (sort !== "new") q.set("sort", sort);
    if (t) q.set("tag", t);
    if (next.page && next.page > 1) q.set("page", String(next.page));
    const s = q.toString();
    return s ? `/explore?${s}` : "/explore";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <nav className="bg-muted flex rounded-lg p-1" aria-label="Sort">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href({ sort: t.key })}
              aria-current={t.key === tab ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                t.key === tab ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {tag && (
          <Link href={href({ tag: null })}>
            <Badge variant="secondary" className="gap-1">
              #{tag} <X className="size-3" />
            </Badge>
          </Link>
        )}
      </div>

      {tab === "following" && !viewer ? (
        <EmptyState
          title="Follow people to fill this feed"
          body="Sign in, then follow prompt authors you like."
          action={{ href: "/sign-in?redirect_url=/explore?sort=following", label: "Sign in" }}
        />
      ) : (
        <FeedList
          viewerId={viewer?.id ?? null}
          options={{
            sort: tab === "top" ? "top" : "new",
            followingOf: tab === "following" ? viewer!.id : undefined,
            tag,
          }}
          page={page}
          pageHref={(p) => href({ page: p })}
          empty={
            tab === "following" ? (
              <EmptyState
                title="Nothing from people you follow yet"
                body="Find authors on the Latest tab and follow them."
              />
            ) : (
              <EmptyState
                title="No public prompts yet"
                body="Publish one of yours to get things started."
                action={{ href: "/prompts", label: "My prompts" }}
              />
            )
          }
        />
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      {action && (
        <Button asChild className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
