import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";

const providers = new Set(MODELS.map((m) => m.provider)).size;

// Facts that come straight from config, so they stay true as the lineup changes.
const STATS = [
  { value: String(MODELS.length), label: `models from ${providers} providers` },
  { value: "4", label: "models side by side" },
  { value: "₹0", label: `to start, ${PLANS.free.runsPerDay} runs a day` },
];

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-4 py-20 text-center sm:py-28">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(126_34_206/0.35),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-2xl space-y-6">
        <h2 className="text-gradient text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Ready to write prompts that work?
        </h2>
        <p className="text-base text-white/60">Free to start. No credit card needed.</p>
        <Button
          asChild
          size="lg"
          className="h-11 bg-purple-600 px-6 text-white shadow-[0_0_30px_rgb(168_85_247/0.35)] hover:bg-purple-500"
        >
          <Link href="/prompts">
            Get started free <ArrowRight />
          </Link>
        </Button>
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-3 pt-6 text-sm text-white/60">
          {STATS.map((s) => (
            <li key={s.label}>
              <span className="font-semibold text-white">{s.value}</span> {s.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
