import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StreakBadge } from "@/components/community/streak-badge";
import { GridSkeleton, PageHeading, PromptsView } from "@/components/folders/prompts-view";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { liveStreak } from "@/server/data/engagement";
import { findUserById } from "@/server/data/users";

export const metadata: Metadata = { title: "My prompts" };

export default function PromptsPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="All prompts" description="Every prompt you've written, newest first.">
        <Button asChild>
          <Link href="/prompts/new">
            <Plus /> New prompt
          </Link>
        </Button>
      </PageHeading>
      <Suspense fallback={<GridSkeleton />}>
        <AllPrompts />
      </Suspense>
    </div>
  );
}

async function AllPrompts() {
  const user = await requireUser();
  const me = await findUserById(db(), user.id);
  return (
    <div className="space-y-4">
      <StreakBadge days={me ? liveStreak(me) : 0} />
      <PromptsView userId={user.id} />
    </div>
  );
}
