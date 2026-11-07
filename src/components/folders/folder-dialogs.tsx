"use client";

import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createFolderAction,
  deleteFolderAction,
  renameFolderAction,
} from "@/server/actions/folders";

/** Create a folder, or rename one when `folder` is given. */
export function FolderNameDialog({
  open,
  onOpenChange,
  folder,
  goToNew = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: { id: string; name: string };
  /** open the new folder after creating it */
  goToNew?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    const name = String(formData.get("name") ?? "");
    startTransition(async () => {
      const result = folder
        ? await renameFolderAction({ folderId: folder.id, name })
        : await createFolderAction({ name });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(folder ? "Folder renamed" : "Folder created");
      onOpenChange(false);
      if (!folder && goToNew && result.data) router.push(`/folders/${result.data.id}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? "Rename folder" : "Create folder"}</DialogTitle>
        </DialogHeader>
        {/* key resets the field each time the dialog opens */}
        <form action={submit} className="space-y-4" key={String(open) + (folder?.id ?? "")}>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder title</Label>
            <Input
              id="folder-name"
              name="name"
              defaultValue={folder?.name}
              placeholder="e.g. Marketing"
              maxLength={60}
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {folder ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFolderDialog({
  folder,
  onOpenChange,
  leavePage = false,
}: {
  folder: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  /** go back to /folders afterwards (when deleting the folder you're looking at) */
  leavePage?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const remove = () =>
    folder &&
    startTransition(async () => {
      const result = await deleteFolderAction({
        folderId: folder.id,
        redirectTo: leavePage ? "/folders" : undefined,
      });
      if (result.ok) {
        toast.success("Folder deleted");
        onOpenChange(false);
      } else toast.error(result.error);
    });

  return (
    <AlertDialog open={!!folder} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{folder?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The folder goes away. Its prompts are kept and move to Unsorted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={pending}>
            Delete folder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** "New folder" button + dialog, for pages. */
export function NewFolderButton(props: React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button {...props} onClick={() => setOpen(true)} />
      <FolderNameDialog open={open} onOpenChange={setOpen} goToNew />
    </>
  );
}
