import { GitFork, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Comments } from "@/components/community/comments";
import { LikeButton, SaveButton } from "@/components/community/engagement";
import { ForkButton } from "@/components/community/fork-button";
import { ShareMenu } from "@/components/community/share-menu";
import { UserAvatar } from "@/components/community/user-avatar";
import { CopyButton } from "@/components/copy-button";
import { Markdown } from "@/components/markdown";
import { ComparePanel } from "@/components/prompts/compare-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { findModel } from "@/config/models";
import { formatLatency, timeAgo } from "@/lib/format";
import { idSchema } from "@/lib/validation";
import { getUser } from "@/server/auth";
import { db } from "@/server/db";
import { getPublicPrompt, getViewerFlags } from "@/server/data/community";
import { listRunsForVersions } from "@/server/data/runs";
import { listComments } from "@/server/data/social";
import { getPromptCard } from "@/server/public-card";
import { getRunContext } from "@/server/run-context";

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const card = idSchema.safeParse(id).success ? await getPromptCard(id) : null;
  if (!card) return { title: "Prompt not found" };
  const description = card.preview.slice(0, 160);
  return {
    title: card.title,
    description,
    openGraph: { title: card.title, description, type: "article" },
    twitter: { card: "summary_large_image", title: card.title, description },
  };
}

export default function PublicPromptPage({ params }: PageProps<"/p/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PublicPrompt params={params} />
    </Suspense>
  );
}

async function PublicPrompt({ params }: { params: PageProps<"/p/[id]">["params"] }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const [prompt, viewer] = await Promise.all([getPublicPrompt(db(), id), getUser()]);
  if (!prompt) notFound();

  const viewerId = viewer?.id ?? null;
  const isOwner = viewerId === prompt.ownerId;
  const [flags, comments] = await Promise.all([
    getViewerFlags(db(), viewerId, [id]),
    listComments(db(), id, viewerId),
  ]);
  const bestModel = prompt.bestRun && findModel(prompt.bestRun.modelId);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/u/${prompt.author.username}`}
            className="flex items-center gap-2 hover:underline"
          >
            <UserAvatar user={prompt.author} className="size-7" />
            <span className="text-foreground font-medium">
              {prompt.author.name || `@${prompt.author.username}`}
            </span>
          </Link>
          {prompt.publishedAt && <span>· {timeAgo(prompt.publishedAt)}</span>}
          {prompt.forkedFrom && (
            <span className="flex items-center gap-1">
              · <GitFork className="size-3" /> forked from{" "}
              <Link href={`/p/${prompt.forkedFrom.id}`} className="hover:underline">
                @{prompt.forkedFrom.username}/{prompt.forkedFrom.title}
              </Link>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{prompt.title}</h1>
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((t) => (
              <Link key={t} href={`/explore?tag=${encodeURIComponent(t)}`}>
                <Badge variant="secondary">{t}</Badge>
              </Link>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="-ml-2 flex items-center">
            <LikeButton
              promptId={id}
              liked={flags.liked.has(id)}
              count={prompt.likes}
              signedIn={!!viewer}
            />
            <SaveButton
              promptId={id}
              saved={flags.saved.has(id)}
              count={prompt.saves}
              signedIn={!!viewer}
            />
            <ShareMenu
              promptId={id}
              title={prompt.title}
              count={prompt.shares}
              signedIn={!!viewer}
            />
            <span className="text-muted-foreground flex items-center gap-1.5 px-2 text-sm">
              <GitFork className="size-4" /> {prompt.forks}
            </span>
          </div>
          <div className="ml-auto">
            {isOwner ? (
              <Button asChild variant="outline">
                <Link href={`/prompts/${id}`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            ) : (
              <ForkButton promptId={id} signedIn={!!viewer} />
            )}
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prompt · v{prompt.versionNumber}</CardTitle>
          <CopyButton text={prompt.content} label="Copy prompt" />
        </CardHeader>
        <CardContent>
          <pre className="bg-muted/50 overflow-x-auto rounded-md p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {prompt.content}
          </pre>
        </CardContent>
      </Card>

      {prompt.bestRun && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-base">Best answer</CardTitle>
            <p className="text-muted-foreground text-xs">
              {bestModel?.label ?? prompt.bestRun.modelId} ·{" "}
              {formatLatency(prompt.bestRun.latencyMs)} · {prompt.bestRun.outputTokens} tokens ·
              temp {prompt.bestRun.temperature}
            </p>
          </CardHeader>
          <CardContent>
            <Markdown>{prompt.bestRun.output}</Markdown>
          </CardContent>
        </Card>
      )}

      {viewer && !isOwner && (
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <TryIt viewer={viewer} versionId={prompt.versionId} />
        </Suspense>
      )}

      <Comments
        promptId={id}
        promptOwnerId={prompt.ownerId}
        comments={comments}
        viewerId={viewerId}
      />
    </article>
  );
}

/** Lets a signed-in visitor run the published version on their own quota. */
async function TryIt({
  viewer,
  versionId,
}: {
  viewer: NonNullable<Awaited<ReturnType<typeof getUser>>>;
  versionId: string;
}) {
  const [runs, { models, limits }] = await Promise.all([
    listRunsForVersions(db(), viewer.id, [versionId]),
    getRunContext(viewer),
  ]);
  return (
    <ComparePanel
      versionId={versionId}
      models={models}
      runs={runs}
      limits={limits}
      canMarkBest={false}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
