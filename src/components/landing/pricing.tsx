"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BuyButton } from "@/components/billing/buy-button";
import { Button } from "@/components/ui/button";
import { MODELS } from "@/config/models";
import { formatRupees, PASSES, PLANS } from "@/config/plans";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const proModels = MODELS.filter((m) => m.tier === "pro").length;

const FREE_FEATURES = [
  `${PLANS.free.runsPerDay} model runs a day`,
  `${PLANS.free.enhancesPerDay} AI enhancements a day`,
  `${MODELS.length - proModels} fast models`,
  `Answers up to ${PLANS.free.maxTokens.toLocaleString()} tokens`,
  "Unlimited prompts, versions & publishing",
];

const PRO_FEATURES = [
  `${PLANS.pro.runsPerDay} model runs a day`,
  `${PLANS.pro.enhancesPerDay} AI enhancements a day`,
  `All ${MODELS.length} models, incl. ${proModels} top-tier`,
  `Answers up to ${PLANS.pro.maxTokens.toLocaleString()} tokens`,
  "Everything in Free",
];

export function LandingPricing() {
  const { isSignedIn } = useAuth();
  const [yearly, setYearly] = useState(false);
  const pass = yearly ? PASSES.pro_year : PASSES.pro_month;
  const perMonth = Math.round(PASSES.pro_year.amountPaise / 12 / 100) * 100;
  const saving = Math.round(
    100 - (PASSES.pro_year.amountPaise / (PASSES.pro_month.amountPaise * 12)) * 100,
  );

  return (
    <section id="pricing" className="px-4 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple"
        accent="pricing"
        subtitle="Start free. Upgrade for more runs and the strongest models."
      />

      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <span className={cn(!yearly ? "text-white" : "text-purple-100/50")}>30 days</span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Show the 365-day pass"
          onClick={() => setYearly((y) => !y)}
          className="relative h-6 w-11 rounded-full border border-purple-500/40 bg-purple-500/20 transition-colors"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-4.5 rounded-full bg-white transition-transform",
              yearly && "translate-x-5",
            )}
          />
        </button>
        <span className={cn(yearly ? "text-white" : "text-purple-100/50")}>
          365 days{" "}
          <span className="ml-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
            save {saving}%
          </span>
        </span>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl items-center gap-6 md:grid-cols-2">
        <PlanCard
          icon={Sparkles}
          eyebrow="Try it out"
          name="Free"
          price="Free"
          note="forever"
          blurb="Everything you need to write, enhance and compare prompts."
          features={FREE_FEATURES}
        >
          <Button
            asChild
            variant="outline"
            className="h-11 w-full border-purple-500/30 bg-white/5 text-purple-200 hover:bg-white/10"
          >
            <Link href="/prompts">
              Get started free <ArrowRight />
            </Link>
          </Button>
        </PlanCard>

        <PlanCard
          highlight
          icon={Zap}
          eyebrow="Most popular"
          name="Pro"
          price={formatRupees(pass.amountPaise)}
          note={yearly ? "/ 365 days" : "/ 30 days"}
          blurb={
            yearly
              ? `That's about ${formatRupees(perMonth)} a month, paid once.`
              : "For people who test prompts every day."
          }
          features={PRO_FEATURES}
        >
          <BuyButton
            key={yearly ? "year" : "month"}
            passKey={yearly ? "pro_year" : "pro_month"}
            signedIn={!!isSignedIn}
            label={`Get Pro · ${formatRupees(pass.amountPaise)}`}
          />
        </PlanCard>
      </div>
      <p className="mt-10 text-center text-sm text-white/40">
        One-time payment, no auto-renew. Fair-use daily AI budget applies.{" "}
        <Link href="/refund-policy" className="underline underline-offset-2 hover:text-white/70">
          Refund policy
        </Link>
      </p>
    </section>
  );
}

function PlanCard({
  highlight,
  icon: Icon,
  eyebrow,
  name,
  price,
  note,
  blurb,
  features,
  children,
}: {
  highlight?: boolean;
  icon: typeof Zap;
  eyebrow: string;
  name: string;
  price: string;
  note: string;
  blurb: string;
  features: string[];
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative space-y-6 rounded-2xl border p-7",
        highlight
          ? "border-purple-500/60 bg-gradient-to-b from-purple-900/50 to-[#0d0716] shadow-[0_0_60px_rgb(147_51_234/0.25)] md:-my-4 md:py-11"
          : "border-purple-500/20 bg-[#0d0716]",
      )}
    >
      {highlight && (
        <span className="absolute top-5 right-5 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-200">
          Most popular
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10">
          <Icon className={cn("size-5", highlight ? "text-yellow-400" : "text-purple-300")} />
        </span>
        <span>
          <span className="block text-xs font-medium text-purple-300">{eyebrow}</span>
          <span className="block font-semibold text-white">{name}</span>
        </span>
      </div>
      <div>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-white">{price}</span>
          <span className="text-sm text-purple-100/50">{note}</span>
        </p>
        <p className="mt-1 text-sm text-white/60">{blurb}</p>
      </div>
      <ul className="space-y-2.5 border-t border-purple-500/15 pt-5">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm text-white/70">
            <Check className="mt-0.5 size-4 shrink-0 text-purple-400" /> {f}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
