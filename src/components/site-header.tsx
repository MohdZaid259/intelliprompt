"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// show: who sees the link
const LINKS = [
  { href: "/explore", label: "Explore", show: "all" },
  { href: "/leaderboard", label: "Leaderboard", show: "all" },
  { href: "/blog", label: "Blog", show: "all" },
  { href: "/pricing", label: "Pricing", show: "signed-out" },
  { href: "/prompts", label: "My prompts", show: "signed-in" },
  { href: "/saved", label: "Saved", show: "signed-in" },
  { href: "/billing", label: "Billing", show: "signed-in" },
  { href: "/settings", label: "Settings", show: "signed-in" },
] as const;

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = LINKS.filter((l) => l.show === "all" || (l.show === "signed-in") === !!isSignedIn);

  const navLinks = (className: string, onNavigate?: () => void) =>
    links.map((l) => {
      const active = pathname.startsWith(l.href);
      return (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
            active ? "bg-accent font-medium" : "text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          {l.label}
        </Link>
      );
    });

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 p-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
              {navLinks("py-2 text-base", () => setOpen(false))}
            </nav>
          </SheetContent>
        </Sheet>
        <Logo />
        <nav className="hidden flex-1 gap-1 md:flex" aria-label="Main">
          {navLinks("")}
        </nav>
        <div className="ml-auto md:ml-0">
          {isLoaded &&
            (isSignedIn ? (
              <UserButton />
            ) : (
              <Button asChild size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}
