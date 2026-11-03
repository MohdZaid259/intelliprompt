"use client";

import { Copy, Loader2, Star, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { findModel } from "@/config/models";
import { formatCost, formatLatency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteRunAction, toggleBestRunAction } from "@/server/actions/prompts";
import type { WorkspaceRun } from "./types";

type Props =
  | { kind: "saved"; run: WorkspaceRun }
  | { kind: "live"; modelId: string; text: string; error: string | null };

export function RunCard(props: Props) {
  const [pending, startTransition] = useTransition();
  const modelId = props.kind === "saved" ? props.run.modelId : props.modelId;
  const model = findModel(modelId);
  const text = props.kind === "saved" ? props.run.output : props.text;
  const error = props.kind === "saved" ? props.run.error : props.error;
  const streaming = props.kind === "live" && !error;

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok && "error" in result) toast.error(result.error);
    });

  return (
    <Card className={cn(props.kind === "saved" && props.run.isBest && "border-primary")}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <p className="text-sm font-semibold">{model?.label ?? modelId}</p>
          <p className="text-muted-foreground text-xs">
            {model?.provider}
            {props.kind === "saved" &&
              ` · ${formatLatency(props.run.latencyMs)} · ${props.run.outputTokens} tokens · ${formatCost(props.run.costUsd)} · temp ${props.run.temperature}`}
          </p>
        </div>
        {props.kind === "saved" ? (
          <div className="flex gap-1">
            {props.run.status === "ok" && (
              <Button
                size="icon"
                variant="ghost"
                aria-label={props.run.isBest ? "Unmark best answer" : "Mark as best answer"}
                aria-pressed={props.run.isBest}
                disabled={pending}
                onClick={() => act(() => toggleBestRunAction({ runId: props.run.id }))}
              >
                <Star className={cn(props.run.isBest && "fill-primary text-primary")} />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              aria-label="Copy answer"
              onClick={() =>
                navigator.clipboard.writeText(text).then(() => toast.success("Copied"))
              }
            >
              <Copy />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete answer"
              disabled={pending}
              onClick={() => act(() => deleteRunAction({ runId: props.run.id }))}
            >
              <Trash2 />
            </Button>
          </div>
        ) : (
          streaming && <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-2 text-sm">{error}</p>}
        {streaming ? (
          <p className="text-sm whitespace-pre-wrap">{text || "…"}</p>
        ) : (
          text && <Markdown>{text}</Markdown>
        )}
      </CardContent>
    </Card>
  );
}
