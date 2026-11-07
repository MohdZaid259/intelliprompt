import { Bookmark, Clock, FileText, Flame, Globe, Heart, Lock, Plus, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StreakRing } from "@/components/dashboard/streak-ring";
import { PageHeading } from "@/components/folders/prompts-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANS } from "@/config/plans";
import { timeAgo } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { getDashboardStats } from "@/server/data/dashboard";
import { listPrompts } from "@/server/data/prompts";
import { getUsage } from "@/server/quota";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Dashboard"
        description="Welcome back! Here's your prompt activity overview."
      >
        <Button asChild>
          <Link href="/prompts/new">
            <Plus /> New prompt
          </Link>
        </Button>
      </PageHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const [stats, usage, recent] = await Promise.all([
    getDashboardStats(db(), user.id),
    getUsage(db(), user.id),
    listPrompts(db(), user.id, { limit: 5 }),
  ]);
  const plan = PLANS[user.plan];
  const budgetPct = Math.min(100, Math.round((usage.costUsd / plan.dailyBudgetUsd) * 100));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Streak progress
            </CardTitle>
            <Flame className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <StreakRing current={stats.streak} best={stats.bestStreak} />
            <p className="text-muted-foreground mt-2 text-center text-xs">
              Run, enhance or publish once a day to keep it going.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Private prompts"
            icon={<Lock className="size-4" />}
            value={stats.prompts - stats.published}
            note={`${stats.prompts} in total`}
          />
          <StatCard
            title="Today's AI usage"
            icon={<Zap className="size-4" />}
            value={`${usage.runs}/${plan.runsPerDay}`}
            note={`runs · ${budgetPct}% of fair-use budget`}
            progress={budgetPct}
          />
          <StatCard
            title="Community likes"
            icon={<Heart className="size-4" />}
            value={stats.likes}
            note={`+${stats.likesThisWeek} this week`}
          />
          <StatCard
            title="Shared prompts"
            icon={<Globe className="size-4" />}
            value={stats.published}
            note={`${stats.saves} saves by others`}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent prompts</CardTitle>
          <CardDescription>Your most recently updated prompts.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing yet.{" "}
              <Link href="/prompts/new" className="text-primary hover:underline">
                Create your first prompt
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/prompts/${p.id}`}
                    className="hover:bg-accent/50 -mx-2 flex items-start gap-3 rounded-md px-2 py-3 transition-colors"
                  >
                    <FileText className="text-primary mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="truncate font-medium">{p.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {p.folderName ?? "Unsorted"} · <Clock className="inline size-3" />{" "}
                          {timeAgo(p.updatedAt)}
                        </span>
                      </div>
                      {p.preview && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {p.preview}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Bookmark className="size-3.5" /> Prompts you saved from others are in{" "}
        <Link href="/library" className="text-primary hover:underline">
          My Library
        </Link>
        .
      </p>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  note,
  progress,
}: {
  title: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  note: string;
  progress?: number;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <span className="bg-muted text-muted-foreground rounded-full p-2">{icon}</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-bold">{value}</p>
        {progress !== undefined && (
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="text-muted-foreground text-xs">{note}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Skeleton className="h-80" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
