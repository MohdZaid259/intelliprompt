"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enhanceAction } from "@/server/actions/prompts";
import { VersionDiff } from "./version-diff";

type Suggestion = { prompt: string; changes: string[] };

/** Asks the enhancer for a better prompt and shows a diff the user can accept or discard. */
export function EnhanceButton({
  content,
  onAccept,
}: {
  content: string;
  onAccept: (enhanced: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const enhance = () =>
    startTransition(async () => {
      const result = await enhanceAction({ content });
      if (result.ok) setSuggestion(result.data);
      else toast.error(result.error);
    });

  if (suggestion) {
    return (
      <div className="border-primary/40 bg-primary/5 space-y-3 rounded-lg border p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="text-primary size-4" /> Suggested improvement
        </p>
        <VersionDiff before={content} after={suggestion.prompt} />
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {suggestion.changes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onAccept(suggestion.prompt);
              setSuggestion(null);
            }}
          >
            <Check /> Use this
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
            <X /> Discard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={enhance}
      disabled={pending || !content.trim()}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {pending ? "Enhancing…" : "Enhance"}
    </Button>
  );
}
