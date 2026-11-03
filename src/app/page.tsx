import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-4">
        <Logo />
        <nav className="flex gap-1">
          <Button asChild variant="ghost">
            <Link href="/explore">Explore</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Better prompts, <span className="text-primary">proven</span> across models
        </h1>
        <p className="text-muted-foreground text-lg">
          Enhance a prompt, run it on several models side by side, keep the best version, and share
          it with the community.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/prompts">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/explore">Browse prompts</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
