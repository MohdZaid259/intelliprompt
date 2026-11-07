"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteFolderDialog, FolderNameDialog } from "./folder-dialogs";

/** Rename / delete / add-prompt buttons on a folder's page. */
export function FolderActions({ folder }: { folder: { id: string; name: string } }) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label="Rename folder"
        onClick={() => setRenaming(true)}
      >
        <Pencil />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Delete folder"
        onClick={() => setDeleting(true)}
      >
        <Trash2 />
      </Button>
      <Button asChild>
        <Link href={`/prompts/new?folder=${folder.id}`}>
          <Plus /> New prompt
        </Link>
      </Button>
      <FolderNameDialog open={renaming} onOpenChange={setRenaming} folder={folder} />
      <DeleteFolderDialog folder={deleting ? folder : null} onOpenChange={setDeleting} leavePage />
    </>
  );
}
