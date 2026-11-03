import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      {/* the header reads the current path, so it streams in behind a boundary */}
      <Suspense fallback={<div className="h-[69px] border-b" />}>
        <SiteHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
    </div>
  );
}
