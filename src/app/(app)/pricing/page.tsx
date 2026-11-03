import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanCards } from "@/components/billing/plan-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free to start. Pro for more runs, longer answers and top-tier models.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          Start free. Upgrade when you need more runs and the strongest models.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Plans />
      </Suspense>
    </div>
  );
}

async function Plans() {
  const user = await getUser();
  return <PlanCards signedIn={!!user} currentPlan={user?.plan} />;
}
