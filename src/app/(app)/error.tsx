"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Server errors arrive with a generic message and a digest that matches the server logs.
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        This page hit an error. Trying again usually fixes it.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
      {digest && <p className="text-muted-foreground font-mono text-xs">Reference: {digest}</p>}
    </div>
  );
}
