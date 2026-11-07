"use client";

import { Crown, Lock, XIcon } from "lucide-react";
import Link from "next/link";
import { ProviderIcon } from "@/components/provider-icon";
import { SoonBadge } from "@/components/soon-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDERS } from "@/config/models";
import { cn } from "@/lib/utils";
import type { WorkspaceModel } from "./types";

/** provider name → chosen model id */
export type ModelSelection = Record<string, string>;

/** One card per provider with a model dropdown, like v1. One model per provider. */
export function ModelPicker({
  models,
  selection,
  onChange,
  max,
}: {
  models: WorkspaceModel[];
  selection: ModelSelection;
  onChange: (next: ModelSelection) => void;
  max: number;
}) {
  const count = Object.keys(selection).length;
  // providers we know about first, then any new provider from the model list
  const known = PROVIDERS.filter((p) => p.comingSoon || models.some((m) => m.provider === p.name));
  const extra = [...new Set(models.map((m) => m.provider))]
    .filter((name) => !PROVIDERS.some((p) => p.name === name))
    .map((name) => ({ name, description: "", comingSoon: false }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Select models</h3>
        <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs">
          {count} of {max} selected
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {[...known, ...extra].map((p) => {
          const options = models.filter((m) => m.provider === p.name);
          const chosen = selection[p.name];
          const allLocked = options.length > 0 && options.every((m) => m.locked);
          const full = !chosen && count >= max;
          return (
            <ProviderCard
              key={p.name}
              name={p.name}
              description={p.description}
              options={options}
              chosen={chosen}
              comingSoon={!!p.comingSoon}
              proOnly={allLocked}
              full={full}
              onSelect={(id) => onChange({ ...selection, [p.name]: id })}
              onClear={() => {
                const next = { ...selection };
                delete next[p.name];
                onChange(next);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProviderCard({
  name,
  description,
  options,
  chosen,
  comingSoon,
  proOnly,
  full,
  onSelect,
  onClear,
}: {
  name: string;
  description: string;
  options: WorkspaceModel[];
  chosen: string | undefined;
  comingSoon: boolean;
  proOnly: boolean;
  full: boolean;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const disabled = comingSoon || proOnly;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-200",
        disabled
          ? "border-muted bg-muted/30"
          : chosen
            ? "border-primary bg-primary/5 shadow-md"
            : "bg-card hover:border-primary/50 hover:shadow-lg",
      )}
    >
      <div className={cn("space-y-3 p-4", disabled && "opacity-50")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-[#09090b] p-2 text-white">
              <ProviderIcon provider={name} />
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold">{name}</h4>
              {description && (
                <p className="text-muted-foreground truncate text-xs">{description}</p>
              )}
            </div>
          </div>
          {chosen && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 size-7"
              onClick={onClear}
              aria-label={`Remove ${name}`}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
        <Select value={chosen ?? ""} onValueChange={onSelect} disabled={disabled || full}>
          <SelectTrigger className="w-full" aria-label={`${name} model`}>
            <SelectValue
              placeholder={
                comingSoon
                  ? "Coming soon"
                  : proOnly
                    ? "Pro required"
                    : full
                      ? "Limit reached"
                      : "Choose model"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((m) => (
              <SelectItem key={m.id} value={m.id} disabled={m.locked}>
                <span className="flex items-center gap-2">
                  {m.label}
                  {m.locked && (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Lock className="size-3" /> Pro
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {comingSoon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <SoonBadge />
        </div>
      )}
      {!comingSoon && proOnly && (
        <Link
          href="/billing"
          className="bg-background/40 absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-medium"
        >
          <Crown className="size-5 text-amber-500" /> Pro only
        </Link>
      )}
    </div>
  );
}
