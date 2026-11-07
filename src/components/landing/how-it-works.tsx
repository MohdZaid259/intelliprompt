import { Columns3, FileText, Globe, Sparkles, Star } from "lucide-react";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    icon: FileText,
    title: "Write your prompt",
    body: "Start rough. Paste what you have or type the idea in plain words — no prompt-engineering skills needed.",
  },
  {
    icon: Sparkles,
    title: "Enhance with AI",
    body: "One click rewrites it for clarity, structure and output format, and shows exactly what changed.",
  },
  {
    icon: Columns3,
    title: "Compare models",
    body: "Run it on up to four models at once and watch the answers stream in side by side, with cost and speed.",
  },
  {
    icon: Star,
    title: "Keep the best version",
    body: "Every edit is a new version. Diff them, restore old ones, and star the answer that wins.",
  },
  {
    icon: Globe,
    title: "Share & get feedback",
    body: "Publish the winner. Others like, save, comment and fork it — and you climb the leaderboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-24">
      <SectionHeading
        eyebrow="The process"
        title="How it"
        accent="works"
        subtitle="Five steps from a rough idea to a prompt you know works — guided by AI the entire way."
      />
      <ol className="mx-auto mt-14 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li
            key={title}
            className="bg-dots relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/60 to-[#0d0716] p-6"
          >
            {/* connector to the next card */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="absolute top-1/2 -right-6 hidden h-px w-6 bg-purple-500/40 lg:block"
              />
            )}
            <span
              aria-hidden
              className="absolute top-3 right-4 text-6xl font-black text-purple-500/[0.07]"
            >
              {i + 1}
            </span>
            <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10">
              <Icon className="size-5 text-purple-300" />
            </div>
            <p className="mb-3 inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-purple-300">
              STEP {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm leading-relaxed text-purple-100/55">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
