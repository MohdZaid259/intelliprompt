"use client";

import { Check, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/validation";
import { enhanceAction } from "@/server/actions/prompts";
import { VersionDiff } from "./version-diff";

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/**
 * v1's two-panel editor: the prompt on the left, the AI enhanced version on the right.
 * `onEnhanced` fires when the user accepts a suggestion.
 */
export function PromptEditor({
  value,
  onChange,
  onEnhanced,
}: {
  value: string;
  onChange: (value: string) => void;
  onEnhanced: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-sm font-medium">
            Prompt content
          </Label>
          <span className="text-muted-foreground text-xs">~{estimateTokens(value)} tokens</span>
        </div>
        <div className="relative flex-1">
          <Textarea
            id="content"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={LIMITS.content}
            placeholder="Enter your prompt here. Be specific about what you want — rough is fine, you can enhance it."
            className="border-border/50 focus:border-primary/50 bg-background/50 h-full min-h-72 resize-none pb-8 text-sm"
            required
          />
          <span className="text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs">
            {value.length.toLocaleString()} characters
          </span>
        </div>
      </div>
      <EnhancePanel content={value} onAccept={onEnhanced} />
    </div>
  );
}

type Suggestion = { prompt: string; changes: string[] };

function EnhancePanel({
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="bg-primary size-2 rounded-full" /> AI enhanced version
        </span>
        {suggestion && (
          <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs">
            ~{estimateTokens(suggestion.prompt)} tokens
          </span>
        )}
      </div>
      <div className="bg-card/40 flex min-h-72 flex-1 flex-col rounded-xl border">
        {pending ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm">
            <Loader2 className="text-primary size-8 animate-spin" />
            Enhancing your prompt…
          </div>
        ) : suggestion ? (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <p className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" /> Enhanced successfully
            </p>
            <div className="max-h-64 overflow-y-auto text-sm">
              <VersionDiff before={content} after={suggestion.prompt} />
            </div>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
              {suggestion.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onAccept(suggestion.prompt);
                  setSuggestion(null);
                }}
              >
                <Check /> Replace original
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={enhance}>
                <RefreshCw /> Re-enhance
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                <X /> Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <Sparkles className="text-primary/70 size-10" />
            <p className="font-semibold">AI enhancement ready</p>
            <p className="text-muted-foreground max-w-xs text-sm">
              Write your prompt, then let AI make it clearer and more specific. You review every
              change.
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-primary/40 text-primary mt-2 rounded-full"
              onClick={enhance}
              disabled={!content.trim()}
            >
              <Sparkles /> Enhance with AI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
