import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GridSkeleton, PageHeading, PromptsView } from "@/components/folders/prompts-view";
import { PageCrumbs } from "@/components/shell/breadcrumbs";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Unsorted" };

export default function UnsortedPage() {
  return (
    <div className="space-y-6">
      <PageCrumbs items={[{ label: "Folders", href: "/folders" }, { label: "Unsorted" }]} />
      <PageHeading
        title="Unsorted"
        description="Prompts that aren't in a folder. Use a card's menu to move one."
      >
        <Button asChild>
          <Link href="/prompts/new">
            <Plus /> New prompt
          </Link>
        </Button>
      </PageHeading>
      <Suspense fallback={<GridSkeleton />}>
        <Unsorted />
      </Suspense>
    </div>
  );
}

async function Unsorted() {
  const user = await requireUser();
  return <PromptsView userId={user.id} folder={null} />;
}
