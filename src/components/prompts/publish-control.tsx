"use client";

import { ExternalLink, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { findSensitive } from "@/lib/sensitive";
import { publishAction, unpublishAction } from "@/server/actions/community";
import type { WorkspacePrompt, WorkspaceVersion } from "./types";

/** Publishing shows one chosen version publicly; later edits stay private until republished. */
export function PublishControl({
  prompt,
  selected,
  versions,
}: {
  prompt: WorkspacePrompt;
  selected: WorkspaceVersion;
  versions: WorkspaceVersion[];
}) {
  const [pending, startTransition] = useTransition();
  const isPublic = prompt.visibility === "public";
  const published = versions.find((v) => v.id === prompt.publishedVersionId);

  // people paste real data into prompts; check before it goes public
  const [warning, setWarning] = useState<string[] | null>(null);
  const tryPublish = () => {
    const found = findSensitive(selected.content);
    if (found.length > 0) setWarning(found);
    else publish();
  };

  const publish = () =>
    startTransition(async () => {
      const result = await publishAction({ promptId: prompt.id, versionId: selected.id });
      if (result.ok) toast.success(`v${selected.number} is now public`);
      else toast.error(result.error);
    });

  const unpublish = () =>
    startTransition(async () => {
      const result = await unpublishAction({ promptId: prompt.id });
      if (result.ok) toast.success("Prompt is private again");
      else toast.error(result.error);
    });

  return (
    <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
      <p className="flex items-center gap-2">
        {isPublic ? (
          <>
            <Globe className="text-primary size-4" />
            Public, showing v{published?.number ?? "?"}
          </>
        ) : (
          <>
            <Lock className="text-muted-foreground size-4" /> Private — only you can see it
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {isPublic && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/p/${prompt.id}`}>
              <ExternalLink /> View
            </Link>
          </Button>
        )}
        {(!isPublic || published?.id !== selected.id) && (
          <Button size="sm" onClick={tryPublish} disabled={pending}>
            {isPublic ? `Show v${selected.number} instead` : `Publish v${selected.number}`}
          </Button>
        )}
        {isPublic && (
          <Button size="sm" variant="outline" onClick={unpublish} disabled={pending}>
            Unpublish
          </Button>
        )}
      </div>
      <AlertDialog open={warning !== null} onOpenChange={(open) => !open && setWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This prompt may contain private info</AlertDialogTitle>
            <AlertDialogDescription>
              v{selected.number} looks like it includes {joinLabels(warning ?? [])}. Once published,
              anyone can see it. Consider replacing it with a placeholder like {"{email}"} first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Edit first</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setWarning(null);
                publish();
              }}
            >
              Publish anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const joinLabels = (labels: string[]) =>
  labels.length <= 1
    ? (labels[0] ?? "")
    : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
