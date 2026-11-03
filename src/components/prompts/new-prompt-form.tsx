"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseTags } from "@/lib/format";
import { LIMITS } from "@/lib/validation";
import { createPromptAction } from "@/server/actions/prompts";
import { EnhanceButton } from "./enhance-button";

export function NewPromptForm() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // redirects to the new prompt on success
      const result = await createPromptAction({ title, content, tags: parseTags(tags) });
      if (result && !result.ok) toast.error(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
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
        <Label htmlFor="content">Prompt</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={LIMITS.content}
          placeholder="Write your prompt. Rough is fine — you can enhance it."
          className="min-h-48 font-mono text-sm"
          required
        />
        <EnhanceButton content={content} onAccept={setContent} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="writing, marketing (comma separated)"
        />
      </div>
      <Button type="submit" disabled={pending || !title.trim() || !content.trim()}>
        {pending && <Loader2 className="animate-spin" />} Create prompt
      </Button>
    </form>
  );
}
