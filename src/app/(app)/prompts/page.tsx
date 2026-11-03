import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { StreakBadge } from "@/components/community/streak-badge";
import { liveStreak } from "@/server/data/engagement";
import { listPrompts } from "@/server/data/prompts";
import { findUserById } from "@/server/data/users";

export const metadata: Metadata = { title: "My prompts" };

export default function PromptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My prompts</h1>
        <Button asChild>
          <Link href="/prompts/new">
            <Plus /> New prompt
          </Link>
        </Button>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <PromptList />
      </Suspense>
    </div>
  );
}

async function PromptList() {
  const user = await requireUser();
  const [prompts, me] = await Promise.all([
    listPrompts(db(), user.id),
    findUserById(db(), user.id),
  ]);
  const streak = me ? liveStreak(me) : 0;

  if (prompts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">No prompts yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Write one, enhance it, and see how different models answer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StreakBadge days={streak} />
      <ul className="divide-y rounded-lg border">
        {prompts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/prompts/${p.id}`}
              className="hover:bg-accent flex items-center justify-between gap-4 p-4 transition-colors"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{p.title}</p>
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-muted-foreground shrink-0 text-right text-xs">
                <p>
                  {p.versionCount} version{p.versionCount === 1 ? "" : "s"}
                </p>
                <p>{timeAgo(p.updatedAt)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
