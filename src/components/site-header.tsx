"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/explore", label: "Explore", private: false },
  { href: "/leaderboard", label: "Leaderboard", private: false },
  { href: "/blog", label: "Blog", private: false },
  { href: "/prompts", label: "My prompts", private: true },
  { href: "/saved", label: "Saved", private: true },
  { href: "/settings", label: "Settings", private: true },
];

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 p-4">
        <Logo />
        <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Main">
          {LINKS.filter((l) => !l.private || isSignedIn).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                pathname.startsWith(l.href)
                  ? "bg-accent font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {isLoaded &&
          (isSignedIn ? (
            <UserButton />
          ) : (
            <Button asChild size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          ))}
      </div>
    </header>
  );
}
