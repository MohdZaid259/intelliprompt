import { Flame } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { UserAvatar } from "@/components/community/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LEADERBOARD_POINTS as P } from "@/config/engagement";
import { cn } from "@/lib/utils";
import { db } from "@/server/db";
import { getLeaderboard, liveStreak } from "@/server/data/engagement";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top prompt authors on IntelliPrompt.",
};

type Period = "week" | "all";

async function cachedBoard(period: Period) {
  "use cache";
  cacheLife("minutes");
  const since = period === "week" ? new Date(Date.now() - 7 * 86_400_000) : undefined;
  return getLeaderboard(db(), { since });
}

export default function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">
          Points come from what others do with your public prompts: like +{P.like}, save +{P.save},
          fork +{P.fork}, and +{P.publish} per published prompt.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Board({
  searchParams,
}: {
  searchParams: PageProps<"/leaderboard">["searchParams"];
}) {
  const { period: raw } = await searchParams;
  const period: Period = raw === "all" ? "all" : "week";
  const rows = await cachedBoard(period);

  return (
    <div className="space-y-4">
      <nav className="bg-muted inline-flex rounded-lg p-1" aria-label="Period">
        {(["week", "all"] as const).map((p) => (
          <Link
            key={p}
            href={p === "week" ? "/leaderboard" : "/leaderboard?period=all"}
            aria-current={p === period ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              p === period ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {p === "week" ? "This week" : "All time"}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          No one on the board yet. Publish a prompt and get the first likes.
        </p>
      ) : (
        <ol className="divide-y rounded-lg border">
          {rows.map((r, i) => {
            const streak = liveStreak(r);
            return (
              <li key={r.id} className="flex items-center gap-4 p-3">
                <span className="text-muted-foreground w-6 text-right font-mono text-sm">
                  {i + 1}
                </span>
                <Link href={`/u/${r.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <UserAvatar user={r} className="size-8" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.name || `@${r.username}`}</span>
                    <span className="text-muted-foreground block text-xs">@{r.username}</span>
                  </span>
                </Link>
                {streak > 1 && (
                  <span
                    className="flex items-center gap-1 text-sm text-orange-500"
                    title="Day streak"
                  >
                    <Flame className="size-4" /> {streak}
                  </span>
                )}
                <span className="w-16 text-right font-semibold tabular-nums">{r.points}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
