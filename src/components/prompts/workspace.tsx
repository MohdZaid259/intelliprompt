"use client";

import { useState } from "react";
import { ComparePanel } from "./compare-panel";
import { PromptHeader } from "./prompt-header";
import type {
  WorkspaceLimits,
  WorkspaceModel,
  WorkspacePrompt,
  WorkspaceRun,
  WorkspaceVersion,
} from "./types";
import { VersionEditor } from "./version-editor";
import { VersionList } from "./version-list";

export function PromptWorkspace({
  prompt,
  versions,
  runs,
  models,
  limits,
}: {
  prompt: WorkspacePrompt;
  versions: WorkspaceVersion[]; // newest first
  runs: WorkspaceRun[];
  models: WorkspaceModel[];
  limits: WorkspaceLimits;
}) {
  const latest = versions[0];
  const [selectedId, setSelectedId] = useState(latest.id);
  // after saving, jump to the new latest version once the server data arrives
  const [followLatest, setFollowLatest] = useState(false);
  const selected = (followLatest ? latest : versions.find((v) => v.id === selectedId)) ?? latest;

  const select = (id: string) => {
    setFollowLatest(false);
    setSelectedId(id);
  };

  return (
    <div className="space-y-6">
      <PromptHeader prompt={prompt} />
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-6">
          <VersionEditor
            key={selected.id}
            promptId={prompt.id}
            version={selected}
            latest={latest}
            onSaved={() => setFollowLatest(true)}
          />
          <ComparePanel
            key={`runs-${selected.id}`}
            versionId={selected.id}
            models={models}
            runs={runs.filter((r) => r.versionId === selected.id)}
            limits={limits}
          />
        </div>
        <aside className="order-first lg:order-none">
          <VersionList versions={versions} selectedId={selected.id} onSelect={select} />
        </aside>
      </div>
    </div>
  );
}
