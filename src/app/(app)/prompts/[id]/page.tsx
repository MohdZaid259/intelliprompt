import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PromptWorkspace } from "@/components/prompts/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { canUseModel, MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";
import { idSchema } from "@/lib/validation";
import { getActiveModelIds } from "@/server/ai/models";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { getOwnedPrompt } from "@/server/data/prompts";
import { listRunsForVersions } from "@/server/data/runs";
import { getUsage } from "@/server/quota";

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

  const plan = PLANS[user.plan];
  const [runs, activeIds, usage] = await Promise.all([
    listRunsForVersions(
      db(),
      user.id,
      prompt.versions.map((v) => v.id),
    ),
    getActiveModelIds(),
    getUsage(db(), user.id),
  ]);

  const models = MODELS.filter((m) => activeIds.includes(m.id)).map((m) => ({
    ...m,
    locked: !canUseModel(m, plan.modelTier),
  }));

  return (
    <PromptWorkspace
      prompt={{ id: prompt.id, title: prompt.title, tags: prompt.tags }}
      versions={prompt.versions}
      runs={runs}
      models={models}
      limits={{ runsPerDay: plan.runsPerDay, runsUsed: usage.runs, maxTokens: plan.maxTokens }}
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
