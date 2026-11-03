import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanCards } from "@/components/billing/plan-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupees, isPassKey, PASSES, PLANS } from "@/config/plans";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { listPayments } from "@/server/data/billing";
import { findUserById } from "@/server/data/users";
import { getUsage } from "@/server/quota";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Plan & billing</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Billing />
      </Suspense>
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

async function Billing() {
  const user = await requireUser();
  const [me, usage, history] = await Promise.all([
    findUserById(db(), user.id),
    getUsage(db(), user.id),
    listPayments(db(), user.id),
  ]);
  const plan = PLANS[user.plan];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {plan.label} plan
            {user.plan === "pro" && me?.planExpiresAt && (
              <span className="text-muted-foreground text-sm font-normal">
                until {dateFmt.format(me.planExpiresAt)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Meter label="Model runs today" used={usage.runs} limit={plan.runsPerDay} />
          <Meter label="Enhancements today" used={usage.enhances} limit={plan.enhancesPerDay} />
          <p className="text-muted-foreground text-xs sm:col-span-2">Limits reset at 00:00 UTC.</p>
        </CardContent>
      </Card>

      <PlanCards signedIn currentPlan={user.plan} />

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Payment history</h2>
          <ul className="divide-y rounded-lg border text-sm">
            {history.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 p-3">
                <span>{isPassKey(p.planKey) ? PASSES[p.planKey].label : p.planKey}</span>
                <span className="text-muted-foreground">{dateFmt.format(p.createdAt)}</span>
                <span className="tabular-nums">{formatRupees(p.amountPaise)}</span>
                <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                  {p.status === "created" ? "not completed" : p.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {used} / {limit}
        </span>
      </div>
      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemax={limit}
      >
        <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
