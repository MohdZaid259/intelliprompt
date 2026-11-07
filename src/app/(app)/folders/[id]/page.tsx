import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FolderActions } from "@/components/folders/folder-actions";
import { GridSkeleton, PageHeading, PromptsView } from "@/components/folders/prompts-view";
import { PageCrumbs } from "@/components/shell/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { idSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { getOwnedFolder } from "@/server/data/folders";

export default function FolderPage({ params }: PageProps<"/folders/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-9 w-60" />
          <GridSkeleton />
        </div>
      }
    >
      <Folder params={params} />
    </Suspense>
  );
}

async function Folder({ params }: { params: PageProps<"/folders/[id]">["params"] }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const user = await requireUser();
  const folder = await getOwnedFolder(db(), user.id, id);
  if (!folder) notFound();

  return (
    <div className="space-y-6">
      <title>{`${folder.name} · IntelliPrompt`}</title>
      <PageCrumbs items={[{ label: "Folders", href: "/folders" }, { label: folder.name }]} />
      <PageHeading title={folder.name} description="Prompts in this folder.">
        <FolderActions folder={folder} />
      </PageHeading>
      <PromptsView userId={user.id} folder={folder.id} />
    </div>
  );
}
