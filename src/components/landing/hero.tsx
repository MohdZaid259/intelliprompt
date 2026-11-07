import { ArrowRight, Columns3, History, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CHIPS = [
  { icon: Columns3, label: "Side-by-side model runs" },
  { icon: Sparkles, label: "One-click prompt enhance" },
  { icon: History, label: "Full version history" },
];

export function Hero() {
  return (
    <section className="relative px-4 pt-20 pb-24 text-center sm:pt-28">
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-200">
          <Sparkles className="size-4 text-purple-300" /> AI-powered prompt workbench
        </p>
        <h1 className="text-5xl leading-[1.05] font-black tracking-tight sm:text-7xl">
          <span className="text-gradient">Your prompts, upgraded.</span>
          <br />
          <span className="text-gradient-accent">Proven across models.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-purple-100/70">
          Enhance a rough prompt in one click, run it on several LLMs side by side, keep the version
          that wins, and share it with a community that does the same — all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 bg-gradient-to-r from-purple-500 to-violet-600 px-6 text-base shadow-[0_0_30px_rgb(168_85_247/0.45)] hover:from-purple-400 hover:to-violet-500"
          >
            <Link href="/prompts">
              Get started free <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-purple-500/30 bg-white/5 px-6 text-base hover:bg-white/10"
          >
            <Link href="/explore">Explore prompts</Link>
          </Button>
        </div>
        <ul className="flex flex-wrap justify-center gap-3">
          {CHIPS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-sm text-purple-100/80"
            >
              <Icon className="size-4 text-purple-300" /> {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
