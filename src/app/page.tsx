import Link from "next/link";
import { Suspense } from "react";
import { LandingAccountLink } from "@/components/landing-account-link";
import { CommunityWall } from "@/components/landing/community-wall";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingPricing } from "@/components/landing/pricing";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

// Always dark, whatever the app theme: the `dark` class switches the design tokens.
export default function LandingPage() {
  return (
    <div className="dark font-landing relative flex flex-1 flex-col overflow-x-hidden bg-[#0b0613] text-white">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(ellipse_at_top,rgb(126_34_206/0.45),transparent_60%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between p-4">
        <Logo />
        <nav className="flex gap-1">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/explore">Explore</Link>
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="#pricing">Pricing</Link>
          </Button>
          <LandingAccountLink />
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        <Hero />
        <HowItWorks />
        <Suspense>
          <CommunityWall />
        </Suspense>
        <Suspense>
          <LandingPricing />
        </Suspense>
        <FinalCta />
      </main>

      <footer className="relative z-10 border-t border-purple-500/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-6 text-sm text-purple-100/50">
          <Logo />
          <nav className="flex flex-wrap gap-6">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
