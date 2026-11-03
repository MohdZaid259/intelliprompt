import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/auth";

export default function PromptsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-8 w-64" />}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  const user = await requireUser();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Welcome, {user.name || user.username}</h1>
      <p className="text-muted-foreground">Your prompts will live here.</p>
    </div>
  );
}
