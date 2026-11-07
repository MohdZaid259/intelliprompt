"use client";

import { Folder, Inbox, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseTags } from "@/lib/format";
import { LIMITS } from "@/lib/validation";
import { createPromptAction } from "@/server/actions/prompts";
import { PromptEditor } from "./prompt-editor";

const NONE = "none";

export function NewPromptForm({
  folders,
  defaultFolderId,
}: {
  folders: { id: string; name: string }[];
  defaultFolderId: string | null;
}) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? NONE);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // redirects to the new prompt on success
      const result = await createPromptAction({
        title,
        content,
        tags: parseTags(tags),
        folderId: folderId === NONE ? null : folderId,
      });
      if (result && !result.ok) toast.error(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="space-y-2">
          <Label htmlFor="title">Prompt title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIMITS.title}
            placeholder="e.g. Cold email for SaaS founders"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="folder">Folder</Label>
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger id="folder" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                <Inbox /> Unsorted
              </SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <Folder /> {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <PromptEditor value={content} onChange={setContent} onEnhanced={setContent} />

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="writing, marketing (comma separated)"
          className="max-w-md"
        />
      </div>
      <Button type="submit" disabled={pending || !title.trim() || !content.trim()}>
        {pending ? <Loader2 className="animate-spin" /> : <Plus />} Create prompt
      </Button>
    </form>
  );
}
