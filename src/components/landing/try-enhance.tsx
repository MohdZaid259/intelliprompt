"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { VersionDiff } from "@/components/prompts/version-diff";
import { saveDraft } from "@/lib/draft";
import { tryEnhanceAction } from "@/server/actions/try";

const EXAMPLE = "write a tweet about my new app";

/**
 * The core feature on the home page, before any sign-up: type a rough idea, see it enhanced.
 * Signing up then carries the enhanced prompt into the editor.
 */
export function TryEnhance() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [result, setResult] = useState<{
    before: string;
    prompt: string;
    changes: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const enhance = () =>
    startTransition(async () => {
      setError(null);
      const before = content.trim() || EXAMPLE;
      if (!content.trim()) setContent(EXAMPLE);
      const res = await tryEnhanceAction({ content: before });
      if (res.ok) setResult({ before, ...res.data });
      else setError(res.error);
    });

  const keepIt = () => {
    if (result) saveDraft(result.prompt);
    router.push("/sign-up");
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left shadow-[0_0_60px_rgb(168_85_247/0.12)] backdrop-blur sm:p-4">
      {result ? (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-purple-300 uppercase">
            Your prompt, enhanced
          </p>
          <div className="max-h-56 overflow-y-auto rounded-lg bg-black/20 p-3 text-white/90">
            <VersionDiff before={result.before} after={result.prompt} />
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-label="What changed">
            {result.changes.map((c) => (
              <li
                key={c}
                className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-purple-200"
              >
                {c}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={keepIt} className="bg-purple-600 text-white hover:bg-purple-500">
              Keep it & test on top models <ArrowRight />
            </Button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-sm text-white/50 hover:text-white"
            >
              Try another
            </button>
          </div>
          <p className="text-xs text-white/40">Free account, no card. Google sign-in works.</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enhance();
          }}
          className="space-y-3"
        >
          <label htmlFor="try-prompt" className="sr-only">
            Your rough prompt
          </label>
          <textarea
            id="try-prompt"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1500}
            rows={3}
            placeholder={`Type a rough idea, e.g. "${EXAMPLE}"`}
            className="w-full resize-none rounded-lg bg-black/20 p-3 text-sm text-white placeholder:text-white/35 focus:ring-2 focus:ring-purple-500/50 focus:outline-none sm:text-base"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/40">Try it free, no sign-up.</p>
            <Button
              type="submit"
              disabled={pending}
              className="bg-purple-600 text-white shadow-[0_0_30px_rgb(168_85_247/0.35)] hover:bg-purple-500"
            >
              {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Enhance with AI
            </Button>
          </div>
          {error && <p className="text-sm text-amber-300">{error}</p>}
        </form>
      )}
    </div>
  );
}
