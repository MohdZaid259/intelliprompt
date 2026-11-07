import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PromptWorkspace } from "@/components/prompts/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { idSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { listFolders } from "@/server/data/folders";
import { getOwnedPrompt } from "@/server/data/prompts";
import { listRunsForVersions } from "@/server/data/runs";
import { getRunContext } from "@/server/run-context";

export default function PromptPage({ params }: PageProps<"/prompts/[id]">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <Workspace params={params} />
    </Suspense>
  );
}

async function Workspace({ params }: { params: PageProps<"/prompts/[id]">["params"] }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const user = await requireUser();
  const prompt = await getOwnedPrompt(db(), user.id, id);
  if (!prompt) notFound();

  const [runs, { models, limits }, folders] = await Promise.all([
    listRunsForVersions(
      db(),
      user.id,
      prompt.versions.map((v) => v.id),
    ),
    getRunContext(user),
    listFolders(db(), user.id),
  ]);

  return (
    <PromptWorkspace
      prompt={{
        id: prompt.id,
        title: prompt.title,
        tags: prompt.tags,
        visibility: prompt.visibility,
        publishedVersionId: prompt.bestVersionId,
        folderId: prompt.folderId,
      }}
      folders={folders.map((f) => ({ id: f.id, name: f.name }))}
      versions={prompt.versions}
      runs={runs}
      models={models}
      limits={limits}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
