import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODELS } from "@/config/models";
import { formatRupees, PASSES, PLANS } from "@/config/plans";
import { BuyButton } from "./buy-button";

const proModels = MODELS.filter((m) => m.tier === "pro").length;
const freeModels = MODELS.length - proModels;

/** Free vs Pro, generated from the same config the server enforces. */
export function PlanCards({
  signedIn,
  currentPlan,
}: {
  signedIn: boolean;
  currentPlan?: "free" | "pro";
}) {
  const month = PASSES.pro_month;
  const year = PASSES.pro_year;
  const yearlySaving = Math.round(100 - (year.amountPaise / (month.amountPaise * 12)) * 100);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Free {currentPlan === "free" && <Badge variant="secondary">Current</Badge>}
          </CardTitle>
          <CardDescription className="text-foreground text-3xl font-semibold">₹0</CardDescription>
        </CardHeader>
        <CardContent>
          <Features
            items={[
              `${PLANS.free.runsPerDay} model runs a day`,
              `${PLANS.free.enhancesPerDay} enhancements a day`,
              `${freeModels} fast models`,
              `Answers up to ${PLANS.free.maxTokens.toLocaleString()} tokens`,
              "Unlimited prompts, versions and publishing",
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pro {currentPlan === "pro" && <Badge>Current</Badge>}
          </CardTitle>
          <CardDescription className="text-foreground text-3xl font-semibold">
            {formatRupees(month.amountPaise)}
            <span className="text-muted-foreground text-base font-normal"> / 30 days</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Features
            items={[
              `${PLANS.pro.runsPerDay} model runs a day`,
              `${PLANS.pro.enhancesPerDay} enhancements a day`,
              `All ${MODELS.length} models, including ${proModels} top-tier ones`,
              `Answers up to ${PLANS.pro.maxTokens.toLocaleString()} tokens`,
              "Everything in Free",
            ]}
          />
          <div className="space-y-2">
            <BuyButton
              passKey="pro_month"
              signedIn={signedIn}
              label={`${currentPlan === "pro" ? "Add" : "Get"} 30 days · ${formatRupees(month.amountPaise)}`}
            />
            <BuyButton
              passKey="pro_year"
              signedIn={signedIn}
              variant="outline"
              label={`${currentPlan === "pro" ? "Add" : "Get"} 365 days · ${formatRupees(year.amountPaise)} (save ${yearlySaving}%)`}
            />
            <p className="text-muted-foreground text-center text-xs">
              One-time payment, no auto-renew. Buying again adds to your remaining time. Fair-use
              daily AI budget applies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <Check className="text-primary mt-0.5 size-4 shrink-0" /> {item}
        </li>
      ))}
    </ul>
  );
}
