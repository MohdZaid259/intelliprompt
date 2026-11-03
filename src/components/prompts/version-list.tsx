"use client";

import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkspaceVersion } from "./types";

const SOURCE_LABEL: Record<WorkspaceVersion["source"], string | null> = {
  manual: null,
  enhanced: "enhanced",
  restored: "restored",
  fork: "forked",
};

export function VersionList({
  versions,
  selectedId,
  publishedId,
  onSelect,
}: {
  versions: WorkspaceVersion[];
  selectedId: string;
  publishedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Versions" className="space-y-1">
      <h2 className="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
        Versions
      </h2>
      {versions.map((v) => {
        const label = SOURCE_LABEL[v.source];
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            aria-current={v.id === selectedId}
            className={cn(
              "hover:bg-accent w-full rounded-md px-2 py-2 text-left text-sm transition-colors",
              v.id === selectedId && "bg-accent",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              v{v.number}
              {v.id === publishedId && <Badge className="text-[10px]">public</Badge>}
              {label && (
                <Badge variant="outline" className="text-[10px]">
                  {label}
                </Badge>
              )}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              {v.note || timeAgo(v.createdAt)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
