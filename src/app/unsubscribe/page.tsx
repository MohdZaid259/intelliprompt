import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { verifyUnsubscribe } from "@/server/email/unsubscribe";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

const LIST_LABEL = {
  newsletter: "IntelliPrompt news",
  follows: "emails when people you follow publish",
} as const;

// GET only shows a confirmation; the actual change is a POST, so link scanners can't trigger it.
export default function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <Suspense>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: PageProps<"/unsubscribe">["searchParams"];
}) {
  const p = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

  const done = one(p.done);
  if (done === "newsletter" || done === "follows") {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">You&apos;re unsubscribed</h1>
        <p className="text-muted-foreground">
          You won&apos;t get {LIST_LABEL[done]} anymore. You can change this in{" "}
          <Link href="/settings" className="underline">
            settings
          </Link>
          .
        </p>
      </div>
    );
  }

  const params = { u: one(p.u), l: one(p.l), t: one(p.t) };
  const secret = process.env.UNSUBSCRIBE_SECRET;
  const target = secret ? verifyUnsubscribe(secret, params) : null;
  if (!target) {
    return <p className="text-muted-foreground">This unsubscribe link isn&apos;t valid.</p>;
  }

  return (
    <form method="post" action="/api/unsubscribe" className="space-y-4">
      <h1 className="text-xl font-semibold">Unsubscribe from {LIST_LABEL[target.list]}?</h1>
      <input type="hidden" name="u" value={params.u!} />
      <input type="hidden" name="l" value={params.l!} />
      <input type="hidden" name="t" value={params.t!} />
      <Button type="submit">Unsubscribe</Button>
    </form>
  );
}
