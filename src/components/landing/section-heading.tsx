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
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <p className="text-xs font-medium tracking-[0.25em] text-purple-400 uppercase">{eyebrow}</p>
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
        <span className="text-gradient">{title}</span>{" "}
        <span className="text-gradient-accent">{accent}</span>
      </h2>
      <p className="text-lg text-purple-100/60">{subtitle}</p>
    </div>
  );
}
