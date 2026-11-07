import Link from "next/link";
import { Suspense } from "react";
import { LandingAccountLink } from "@/components/landing-account-link";
import { CommunityWall } from "@/components/landing/community-wall";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ModelStrip } from "@/components/landing/model-strip";
import { LandingPricing } from "@/components/landing/pricing";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "/explore", label: "Explore" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/pricing", label: "Plans and limits" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-up", label: "Create account" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

// Always dark, whatever the app theme: the `dark` class switches the design tokens.
export default function LandingPage() {
  return (
    <div className="dark relative flex flex-1 flex-col overflow-x-hidden bg-[#0b0613] text-white">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(ellipse_at_top,rgb(126_34_206/0.45),transparent_60%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between p-4">
        <Logo />
        <nav className="flex gap-1">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="#features">Features</Link>
          </Button>
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
        <ModelStrip />
        <Features />
        <Suspense>
          <CommunityWall />
        </Suspense>
        <Suspense>
          <LandingPricing />
        </Suspense>
        <FinalCta />
      </main>

      <footer className="relative z-10 border-t border-purple-500/15">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-white/50">
              Enhance, test and share prompts across leading AI models.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="space-y-3 text-sm">
              <p className="font-medium text-white/80">{col.title}</p>
              <ul className="space-y-2 text-white/50">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="border-t border-white/5 py-5 text-center text-xs text-white/40">
          © IntelliPrompt
        </p>
      </footer>
    </div>
  );
}
