import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightRays } from "./light-rays";
import { ProductDemo } from "./product-demo";

export function Hero() {
  return (
    <section className="relative px-4 pt-16 pb-20 text-center sm:pt-24">
      <LightRays />
      <div className="relative mx-auto max-w-3xl space-y-6">
        <p className="text-sm font-medium text-purple-300">AI prompt workbench</p>
        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
          <span className="text-gradient">Better prompts,</span>{" "}
          <span className="text-gradient-accent">proven across models</span>
        </h1>
        <p className="mx-auto max-w-xl text-base text-white/60 sm:text-lg">
          Enhance a rough prompt, compare answers from leading models side by side, and keep the
          version that wins.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="h-11 bg-purple-600 px-6 text-white shadow-[0_0_30px_rgb(168_85_247/0.35)] hover:bg-purple-500"
          >
            <Link href="/prompts">
              Get started free <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 border-white/15 bg-white/5 px-6 hover:bg-white/10"
          >
            <Link href="/explore">Explore prompts</Link>
          </Button>
        </div>
      </div>
      <div className="relative mt-14 sm:mt-16">
        <ProductDemo />
      </div>
    </section>
  );
}
