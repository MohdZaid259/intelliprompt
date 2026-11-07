"use client";

import {
  Clock,
  ExternalLink,
  FolderInput,
  GitBranch,
  Globe,
  Inbox,
  Folder,
  MoreVertical,
  Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/format";
import { movePromptAction } from "@/server/actions/folders";
import { deletePromptAction } from "@/server/actions/prompts";

export type GridPrompt = {
  id: string;
  title: string;
  tags: string[];
  visibility: "private" | "public";
  updatedAt: Date;
  folderId: string | null;
  folderName: string | null;
  versionCount: number;
  latest: number | null;
  preview: string | null;
};

/** The v1-style card grid for a user's own prompts. */
export function PromptGrid({
  prompts,
  folders,
  showFolder = false,
}: {
  prompts: GridPrompt[];
  folders: { id: string; name: string }[];
  /** show which folder each prompt is in (on the all-prompts page) */
  showFolder?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {prompts.map((p) => (
        <PromptCard key={p.id} prompt={p} folders={folders} showFolder={showFolder} />
      ))}
    </div>
  );
}

function PromptCard({
  prompt,
  folders,
  showFolder,
}: {
  prompt: GridPrompt;
  folders: { id: string; name: string }[];
  showFolder: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const move = (folderId: string | null) =>
    startTransition(async () => {
      const result = await movePromptAction({ promptId: prompt.id, folderId });
      if (result.ok) {
        const name = folderId ? folders.find((f) => f.id === folderId)?.name : "Unsorted";
        toast.success(`Moved to ${name}`);
      } else toast.error(result.error);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deletePromptAction({ promptId: prompt.id, stay: true });
      if (result.ok) toast.success("Prompt deleted");
      else toast.error(result.error);
    });

  return (
    <Card
      className={`border-border/50 hover:border-border gap-4 transition-all duration-200 hover:shadow-lg ${pending ? "opacity-60" : ""}`}
    >
      <CardHeader className="flex items-start justify-between gap-2">
        <Link href={`/prompts/${prompt.id}`} className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg leading-tight font-semibold hover:underline">
            {prompt.title}
          </h3>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Prompt options"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput /> Move to folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {folders.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    disabled={f.id === prompt.folderId}
                    onClick={() => move(f.id)}
                  >
                    <Folder /> {f.name}
                  </DropdownMenuItem>
                ))}
                {folders.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem disabled={!prompt.folderId} onClick={() => move(null)}>
                  <Inbox /> Unsorted
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete prompt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {prompt.preview && (
          <div className="bg-muted/30 border-border/30 rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">#v{prompt.latest}</span>
              <Badge variant="secondary" className="text-xs">
                Latest
              </Badge>
              {prompt.visibility === "public" && (
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                  <Globe className="size-3" /> Public
                </Badge>
              )}
            </div>
            <p className="text-foreground/80 line-clamp-3 text-sm leading-relaxed">
              {prompt.preview}
            </p>
          </div>
        )}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <GitBranch className="size-4" />
            {prompt.versionCount} version{prompt.versionCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {timeAgo(prompt.updatedAt)}
          </span>
          {showFolder && (
            <span className="flex items-center gap-1.5">
              {prompt.folderName ? <Folder className="size-4" /> : <Inbox className="size-4" />}
              {prompt.folderName ?? "Unsorted"}
            </span>
          )}
        </div>
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent text-xs">
          <Link href={`/prompts/${prompt.id}#versions`}>
            <GitBranch className="size-3" /> All versions
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1 text-xs">
          <Link href={`/prompts/${prompt.id}`}>
            <ExternalLink className="size-3" /> Open
          </Link>
        </Button>
      </CardFooter>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{prompt.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              All its versions and answers are deleted too. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
