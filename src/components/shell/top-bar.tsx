import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PLANS, type PlanKey } from "@/config/plans";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";

/** The bar above every app page: sidebar toggle, breadcrumbs, theme, plan and upgrade. */
export function TopBar({ plan }: { plan: PlanKey | null }) {
  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Breadcrumbs />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {plan ? (
            <>
              <Badge
                variant="outline"
                className={cn(
                  "border-2 text-xs font-semibold",
                  plan === "pro"
                    ? "border-primary text-primary"
                    : "border-muted-foreground text-muted-foreground",
                )}
              >
                {PLANS[plan].label}
              </Badge>
              {plan === "free" && <UpgradeButton />}
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function UpgradeButton() {
  return (
    <Button
      asChild
      size="sm"
      className="hidden border-0 bg-gradient-to-r from-[#FFD700] via-[#FFC300] to-[#FFB300] text-xs text-black shadow-sm hover:from-[#FFC300] hover:to-[#FFD700] sm:inline-flex"
    >
      <Link href="/billing">
        <ShieldCheck className="size-4" /> Upgrade Plan
      </Link>
    </Button>
  );
}
