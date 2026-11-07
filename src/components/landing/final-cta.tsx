import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";

const providers = new Set(MODELS.map((m) => m.provider)).size;

// Facts that come straight from config, so they stay true as the lineup changes.
const STATS = [
  { value: String(MODELS.length), label: `models from ${providers} providers` },
  { value: "4", label: "models compared in one click" },
  { value: "₹0", label: `to start · ${PLANS.free.runsPerDay} runs a day` },
];

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-4 py-28 text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(126_34_206/0.35),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-3xl space-y-8">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-200">
          <span className="size-2 rounded-full bg-purple-400" />
          <Sparkles className="size-4 text-purple-300" /> Start today — it&apos;s free
        </p>
        <h2 className="text-gradient text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl">
          Ready to write prompts that actually work?
        </h2>
        <p className="text-lg text-purple-100/70">
          Stop guessing which model or wording is best. Test it, keep the winner, and share it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 bg-gradient-to-r from-purple-500 to-violet-600 px-6 text-base shadow-[0_0_30px_rgb(168_85_247/0.45)] hover:from-purple-400 hover:to-violet-500"
          >
            <Link href="/prompts">
              Get started free <ArrowRight />
            </Link>
          </Button>
          <span className="text-sm text-purple-100/40">
            No credit card required · Pro is a one-time pass, no auto-renew
          </span>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-12 gap-y-4 pt-6">
          {STATS.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="text-gradient-accent text-2xl font-black">{s.value}</span>
              <span className="text-sm text-purple-100/80">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
