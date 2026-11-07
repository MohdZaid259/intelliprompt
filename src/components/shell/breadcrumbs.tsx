"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, Fragment, useContext, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { label: string; href?: string };

type Ctx = { crumbs: Crumb[] | null; setCrumbs: (c: Crumb[] | null) => void };
const BreadcrumbContext = createContext<Ctx>({ crumbs: null, setCrumbs: () => {} });

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/** Pages with names the URL can't tell (folders, prompts) set their own trail. */
export function PageCrumbs({ items }: { items: Crumb[] }) {
  const { setCrumbs } = useContext(BreadcrumbContext);
  const key = JSON.stringify(items);
  useEffect(() => {
    setCrumbs(JSON.parse(key) as Crumb[]);
    return () => setCrumbs(null);
  }, [key, setCrumbs]);
  return null;
}

const LABELS: Record<string, string> = {
  explore: "Explore",
  leaderboard: "Leaderboard",
  dashboard: "Dashboard",
  library: "My Library",
  folders: "Folders",
  prompts: "Prompts",
  new: "New",
  blog: "Blog",
  billing: "Billing",
  settings: "Settings",
  pricing: "Pricing",
  admin: "Admin",
  saved: "Saved",
};

/** Fallback trail from the URL: known segments get labels, ids are dropped. */
function fromPath(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  parts.forEach((part, i) => {
    const label = LABELS[part];
    if (label) crumbs.push({ label, href: "/" + parts.slice(0, i + 1).join("/") });
  });
  return crumbs.length ? crumbs : [{ label: "Home", href: "/" }];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { crumbs } = useContext(BreadcrumbContext);
  const items = crumbs ?? fromPath(pathname);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {/* on phones only the last two levels fit */}
              <BreadcrumbItem
                className={i < items.length - 2 ? "hidden md:inline-flex" : "min-w-0"}
              >
                {last || !c.href ? (
                  <BreadcrumbPage className="truncate font-medium">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && (
                <BreadcrumbSeparator className={i < items.length - 2 ? "hidden md:block" : ""} />
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
