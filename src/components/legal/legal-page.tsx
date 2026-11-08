import { LEGAL } from "@/config/legal";

/** Shared layout for the Terms, Privacy, Refund and Contact pages. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">Last updated {LEGAL.updated}</p>
        {intro && <p className="text-muted-foreground">{intro}</p>}
      </header>
      <div className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-xl prose-a:text-primary max-w-none">
        {children}
      </div>
    </article>
  );
}

export function SupportEmail() {
  return <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
}
