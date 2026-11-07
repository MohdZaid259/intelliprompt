import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/server/db";
import { listFolders } from "@/server/data/folders";
import { listPrompts } from "@/server/data/prompts";
import { PromptGrid } from "./prompt-grid";

/**
 * A user's prompts as cards. folder: undefined = all, null = unsorted, id = one folder.
 * The caller has already checked the folder belongs to the user.
 */
export async function PromptsView({ userId, folder }: { userId: string; folder?: string | null }) {
  const [prompts, folders] = await Promise.all([
    listPrompts(db(), userId, { folder }),
    listFolders(db(), userId),
  ]);

  if (prompts.length === 0) {
    const newHref = folder ? `/prompts/new?folder=${folder}` : "/prompts/new";
    return (
      <EmptyState
        title={folder === undefined ? "No prompts yet" : "Nothing in here yet"}
        body="Write a prompt, enhance it with AI, and compare how different models answer."
        action={
          <Button asChild>
            <Link href={newHref}>
              <Plus /> Create prompt
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <PromptGrid
      prompts={prompts}
      folders={folders.map((f) => ({ id: f.id, name: f.name }))}
      showFolder={folder === undefined}
    />
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon = <FileText className="size-8" />,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-60 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function PageHeading({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}
