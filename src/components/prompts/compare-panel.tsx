"use client";

import { Lock, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { parseRunStream, type RunRequest, type RunSummary } from "@/lib/run-protocol";
import { cn } from "@/lib/utils";
import { RunCard } from "./run-card";
import type { WorkspaceLimits, WorkspaceModel, WorkspaceRun } from "./types";

const MAX_MODELS = 4;
const TOKEN_OPTIONS = [512, 1024, 2048, 4096];

type LiveRun = {
  key: string;
  modelId: string;
  text: string;
  error: string | null;
  savedId: string | null;
};

async function streamRun(req: RunRequest, onText: (text: string) => void): Promise<RunSummary> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "The run failed.");
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let received = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value;
    onText(parseRunStream(received).text);
  }
  const { summary } = parseRunStream(received);
  if (!summary) throw new Error("The run was interrupted.");
  return summary;
}

export function ComparePanel({
  versionId,
  models,
  runs,
  limits,
  canMarkBest = true,
}: {
  versionId: string;
  models: WorkspaceModel[];
  runs: WorkspaceRun[];
  limits: WorkspaceLimits;
  /** Only the prompt owner picks the best answer. */
  canMarkBest?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(Math.min(1024, limits.maxTokens));
  const [live, setLive] = useState<LiveRun[]>([]);
  const running = live.some((r) => !r.savedId && !r.error);
  const remaining = limits.runsPerDay - limits.runsUsed;

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((m) => m !== id) : s.length < MAX_MODELS ? [...s, id] : s,
    );

  const update = (key: string, patch: Partial<LiveRun>) =>
    setLive((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const run = async () => {
    const batch = selected.map((modelId) => ({
      key: `${modelId}-${Date.now()}`,
      modelId,
      text: "",
      error: null,
      savedId: null,
    }));
    setLive((all) => [...batch, ...all]);

    await Promise.all(
      batch.map(async ({ key, modelId }) => {
        try {
          const summary = await streamRun({ versionId, modelId, temperature, maxTokens }, (text) =>
            update(key, { text }),
          );
          update(key, { savedId: summary.id, error: summary.error });
        } catch (e) {
          update(key, { error: e instanceof Error ? e.message : "The run failed." });
        }
      }),
    );
    router.refresh(); // pull the saved runs (with metrics) from the server
  };

  // Once a live run is saved and the server list includes it, show the saved card instead.
  const savedIds = new Set(runs.map((r) => r.id));
  const visibleLive = live.filter((r) => !(r.savedId && savedIds.has(r.savedId)));
  const providers = [...new Set(models.map((m) => m.provider))];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare models</CardTitle>
        <CardDescription>
          Pick up to {MAX_MODELS} models. {remaining} of {limits.runsPerDay} runs left today.
          {models.some((m) => m.locked) && (
            <>
              {" "}
              <Link href="/billing" className="text-primary underline-offset-4 hover:underline">
                Unlock all models with Pro
              </Link>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {providers.map((provider) => (
            <div key={provider} className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground w-20 text-xs">{provider}</span>
              {models
                .filter((m) => m.provider === provider)
                .map((m) => {
                  const active = selected.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={m.locked}
                      aria-pressed={active}
                      onClick={() => toggle(m.id)}
                      title={m.locked ? "Available on Pro" : undefined}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-accent",
                        m.locked && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {m.locked && <Lock className="mr-1 inline size-3" />}
                      {m.label}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <label className="w-56 space-y-2 text-sm">
            <span className="flex justify-between">
              Temperature{" "}
              <span className="text-muted-foreground font-mono">{temperature.toFixed(1)}</span>
            </span>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block">Max answer length</span>
            <Select value={String(maxTokens)} onValueChange={(v) => setMaxTokens(Number(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)} disabled={n > limits.maxTokens}>
                    {n.toLocaleString()} tokens
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            onClick={() => {
              if (selected.length > remaining) {
                toast.error(`Only ${remaining} runs left today.`);
                return;
              }
              void run();
            }}
            disabled={running || selected.length === 0}
          >
            <Play /> Run{" "}
            {selected.length > 0 ? `${selected.length} model${selected.length > 1 ? "s" : ""}` : ""}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleLive.map((r) => (
            <RunCard key={r.key} kind="live" modelId={r.modelId} text={r.text} error={r.error} />
          ))}
          {runs.map((r) => (
            <RunCard key={r.id} kind="saved" run={r} canMarkBest={canMarkBest} />
          ))}
        </div>
        {visibleLive.length === 0 && runs.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No answers for this version yet. Pick models and run it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
