"use client";

import { Folder, Inbox, Pencil, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { movePromptAction } from "@/server/actions/folders";
import { parseTags } from "@/lib/format";
import { LIMITS } from "@/lib/validation";
import { deletePromptAction, updatePromptMetaAction } from "@/server/actions/prompts";
import type { WorkspaceFolder, WorkspacePrompt } from "./types";

export function PromptHeader({
  prompt,
  folders,
}: {
  prompt: WorkspacePrompt;
  folders: WorkspaceFolder[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(prompt.title);
  const [tags, setTags] = useState(prompt.tags.join(", "));
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await updatePromptMetaAction({
        promptId: prompt.id,
        title,
        tags: parseTags(tags),
      });
      if (result.ok) setOpen(false);
      else toast.error(result.error);
    });

  const move = (value: string) =>
    startTransition(async () => {
      const folderId = value === "none" ? null : value;
      const result = await movePromptAction({ promptId: prompt.id, folderId });
      if (result.ok) {
        toast.success(`Moved to ${folders.find((f) => f.id === folderId)?.name ?? "Unsorted"}`);
      } else toast.error(result.error);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deletePromptAction({ promptId: prompt.id });
      if (result && !result.ok) toast.error(result.error);
    });

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{prompt.title}</h1>
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={prompt.folderId ?? "none"} onValueChange={move} disabled={pending}>
          <SelectTrigger size="sm" className="w-44" aria-label="Folder">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <Inbox /> Unsorted
            </SelectItem>
            {folders.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <Folder /> {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Pencil /> Edit details
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  maxLength={LIMITS.title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma separated"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={pending || !title.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Delete prompt">
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{prompt.title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                All versions and saved answers are deleted too. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove} disabled={pending}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
