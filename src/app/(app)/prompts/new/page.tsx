import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading } from "@/components/folders/prompts-view";
import { NewPromptForm } from "@/components/prompts/new-prompt-form";
import { PageCrumbs } from "@/components/shell/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { listFolders } from "@/server/data/folders";

export const metadata: Metadata = { title: "New prompt" };

export default function NewPromptPage({ searchParams }: PageProps<"/prompts/new">) {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Create new prompt"
        description="Write your first version, enhance it with AI, then test it on models."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/prompts/new">["searchParams"] }) {
  const user = await requireUser();
  const [folders, { folder }] = await Promise.all([listFolders(db(), user.id), searchParams]);
  // only preselect a folder that is really the user's
  const current = folders.find((f) => f.id === folder);
  return (
    <>
      <PageCrumbs
        items={
          current
            ? [
                { label: "Folders", href: "/folders" },
                { label: current.name, href: `/folders/${current.id}` },
                { label: "New prompt" },
              ]
            : [{ label: "Prompts", href: "/prompts" }, { label: "New prompt" }]
        }
      />
      <NewPromptForm
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        defaultFolderId={current?.id ?? null}
      />
    </>
  );
}
