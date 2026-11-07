import { FolderIcon, FolderPlus, Inbox, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewFolderButton } from "@/components/folders/folder-dialogs";
import { EmptyState, GridSkeleton, PageHeading } from "@/components/folders/prompts-view";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { listFolders } from "@/server/data/folders";
import { listPrompts } from "@/server/data/prompts";

export const metadata: Metadata = { title: "Folders" };

export default function FoldersPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Folders" description="Group your prompts the way you work.">
        <NewFolderButton>
          <FolderPlus /> New folder
        </NewFolderButton>
      </PageHeading>
      <Suspense fallback={<GridSkeleton />}>
        <FolderGrid />
      </Suspense>
    </div>
  );
}

async function FolderGrid() {
  const user = await requireUser();
  const [folders, unsorted] = await Promise.all([
    listFolders(db(), user.id),
    listPrompts(db(), user.id, { folder: null }),
  ]);

  if (folders.length === 0 && unsorted.length === 0) {
    return (
      <EmptyState
        icon={<FolderIcon className="size-8" />}
        title="No folders found"
        body="You haven't created any folders yet. Make one for each project, client or topic."
        action={
          <NewFolderButton>
            <FolderPlus /> Create your first folder
          </NewFolderButton>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {folders.map((f) => (
        <FolderCard
          key={f.id}
          href={`/folders/${f.id}`}
          newHref={`/prompts/new?folder=${f.id}`}
          name={f.name}
          count={f.promptCount}
          icon={<FolderIcon className="text-primary size-5" />}
        />
      ))}
      {unsorted.length > 0 && (
        <FolderCard
          href="/folders/unsorted"
          newHref="/prompts/new"
          name="Unsorted"
          count={unsorted.length}
          icon={<Inbox className="text-muted-foreground size-5" />}
        />
      )}
    </div>
  );
}

function FolderCard({
  href,
  newHref,
  name,
  count,
  icon,
}: {
  href: string;
  newHref: string;
  name: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 relative gap-2 py-5 transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <Link href={href} className="flex min-w-0 items-center gap-2 after:absolute after:inset-0">
          {icon}
          <CardTitle className="truncate text-base font-medium">{name}</CardTitle>
        </Link>
        {count > 0 ? (
          <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
            {count} prompt{count === 1 ? "" : "s"}
          </span>
        ) : (
          <Button asChild variant="outline" size="sm" className="relative z-10 h-7 px-2 text-xs">
            <Link href={newHref}>
              <Plus className="size-3" /> Create prompt
            </Link>
          </Button>
        )}
      </CardHeader>
    </Card>
  );
}
