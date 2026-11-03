"use client";

import type { LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/server/actions/safe-action";
import { useGoToSignIn } from "./sign-in-redirect";

type Toggle = { active: boolean; count: number };

/** Like / save style button: flips immediately, then reconciles with the server. */
export function ToggleCount({
  initial,
  label,
  activeLabel,
  icon: Icon,
  action,
  signedIn,
  activeClassName,
}: {
  initial: Toggle;
  label: string;
  activeLabel: string;
  icon: LucideIcon;
  action: () => Promise<ActionResult<Toggle>>;
  signedIn: boolean;
  activeClassName?: string;
}) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const goToSignIn = useGoToSignIn();

  const onClick = () => {
    if (!signedIn) return goToSignIn();
    const previous = state;
    setState({ active: !previous.active, count: previous.count + (previous.active ? -1 : 1) });
    startTransition(async () => {
      const result = await action();
      if (result.ok) setState(result.data);
      else {
        setState(previous);
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-pressed={state.active}
      aria-label={state.active ? activeLabel : label}
      className="text-muted-foreground gap-1.5 px-2"
    >
      <Icon className={cn(state.active && activeClassName)} />
      <span className="tabular-nums">{state.count}</span>
    </Button>
  );
}
