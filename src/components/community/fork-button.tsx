"use client";

import { GitFork, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { forkAction } from "@/server/actions/community";
import { useGoToSignIn } from "./sign-in-redirect";

/** "Use this prompt": copies it into the viewer's prompts and opens it there. */
export function ForkButton({ promptId, signedIn }: { promptId: string; signedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const goToSignIn = useGoToSignIn();

  const fork = () => {
    if (!signedIn) return goToSignIn();
    startTransition(async () => {
      const result = await forkAction({ promptId });
      if (result && !result.ok) toast.error(result.error);
    });
  };

  return (
    <Button onClick={fork} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <GitFork />} Use this prompt
    </Button>
  );
}
