export function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  /** The part of the title shown in the purple gradient. */
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <p className="text-sm font-medium text-purple-300">{eyebrow}</p>
      <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        <span className="text-gradient">{title}</span>{" "}
        <span className="text-gradient-accent">{accent}</span>
      </h2>
      {subtitle && <p className="text-base text-white/60">{subtitle}</p>}
    </div>
  );
}
