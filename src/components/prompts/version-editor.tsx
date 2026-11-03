"use client";

import { History, Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/validation";
import { restoreVersionAction, saveVersionAction } from "@/server/actions/prompts";
import { EnhanceButton } from "./enhance-button";
import type { WorkspaceVersion } from "./types";
import { VersionDiff } from "./version-diff";

/** Edits start from the selected version; saving always appends a new version. */
export function VersionEditor({
  promptId,
  version,
  latest,
  onSaved,
}: {
  promptId: string;
  version: WorkspaceVersion;
  latest: WorkspaceVersion;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(version.content);
  const [source, setSource] = useState<"manual" | "enhanced">("manual");
  const [showDiff, setShowDiff] = useState(false);
  const [pending, startTransition] = useTransition();

  const isLatest = version.id === latest.id;
  const unchanged = draft.trim() === version.content.trim();

  const save = () =>
    startTransition(async () => {
      const result = await saveVersionAction({ promptId, content: draft, source });
      if (!result.ok) return void toast.error(result.error);
      toast.success(`Saved as v${result.data.number}`);
      setSource("manual");
      onSaved();
    });

  const restore = () =>
    startTransition(async () => {
      const result = await restoreVersionAction({ versionId: version.id });
      if (!result.ok) return void toast.error(result.error);
      toast.success(`Restored as v${result.data.number}`);
      onSaved();
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Version {version.number}
          {isLatest && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">latest</span>
          )}
        </CardTitle>
        {!isLatest && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowDiff((s) => !s)}>
              {showDiff ? "Hide changes" : `Compare with v${latest.number}`}
            </Button>
            <Button size="sm" variant="outline" onClick={restore} disabled={pending}>
              <History /> Restore
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showDiff && !isLatest && (
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-muted-foreground mb-2 text-xs">
              Changes from v{version.number} to v{latest.number}
            </p>
            <VersionDiff before={version.content} after={latest.content} />
          </div>
        )}
        <Textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSource("manual");
          }}
          maxLength={LIMITS.content}
          className="min-h-48 font-mono text-sm"
          aria-label="Prompt"
        />
        <div className="flex flex-wrap items-start gap-2">
          <Button onClick={save} disabled={pending || unchanged || !draft.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Save as v{latest.number + 1}
          </Button>
          <EnhanceButton
            content={draft}
            onAccept={(enhanced) => {
              setDraft(enhanced);
              setSource("enhanced");
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
