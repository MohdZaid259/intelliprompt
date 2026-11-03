"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/server/actions/community";
import { useGoToSignIn } from "./sign-in-redirect";

export function FollowButton({
  userId,
  following,
  followers,
  signedIn,
}: {
  userId: string;
  following: boolean;
  followers: number;
  signedIn: boolean;
}) {
  const [state, setState] = useState({ active: following, count: followers });
  const [pending, startTransition] = useTransition();
  const goToSignIn = useGoToSignIn();

  const toggle = () => {
    if (!signedIn) return goToSignIn();
    const previous = state;
    setState({ active: !previous.active, count: previous.count + (previous.active ? -1 : 1) });
    startTransition(async () => {
      const result = await toggleFollowAction({ userId });
      if (result.ok) setState(result.data);
      else {
        setState(previous);
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant={state.active ? "outline" : "default"} onClick={toggle} disabled={pending}>
        {state.active ? "Following" : "Follow"}
      </Button>
      <span className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium tabular-nums">{state.count}</span> follower
        {state.count === 1 ? "" : "s"}
      </span>
    </div>
  );
}
