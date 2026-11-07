import { Columns3, GitBranch, Globe, Sparkles, TestTubes } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoStill } from "./product-demo";
import { SectionHeading } from "./section-heading";

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  title: string;
  accent: string;
  body: string;
  points: string[];
  picture: React.ReactNode;
};

// Pictures are frozen frames of the landing demo (real UI, drawn in code).
const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    badge: "Smart creation",
    title: "Create and",
    accent: "enhance prompts",
    body: "Start with a rough idea and turn it into a clear, specific prompt with one click. You see every change before you accept it.",
    points: ["Highlights exactly what changed", "Explains why each change helps"],
    picture: <DemoStill t={7.2} camera={[935, 341, 1.3]} />,
  },
  {
    icon: TestTubes,
    badge: "Cross-model testing",
    title: "Test across",
    accent: "multiple LLMs",
    body: "Pick models from OpenAI, Anthropic, Google, Meta and more, then run your prompt on up to four of them at once.",
    points: ["Answers stream in live", "Time, tokens and cost on every answer"],
    picture: <DemoStill t={14.2} camera={[700, 330, 1.12]} />,
  },
  {
    icon: Columns3,
    badge: "Side-by-side comparison",
    title: "Compare outputs",
    accent: "with precision",
    body: "Read the answers side by side, star the one that wins, and keep it with the exact version that produced it.",
    points: ["One best answer per version", "Temperature and length controls"],
    picture: <DemoStill t={17.8} camera={[700, 440, 1.25]} />,
  },
  {
    icon: GitBranch,
    badge: "Version control",
    title: "Keep every",
    accent: "iteration organized",
    body: "Every save is a new version. Compare any two, restore an old one, and sort prompts into folders by project.",
    points: ["Diffs between versions", "Folders, tags and an Unsorted inbox"],
    picture: <VersionsPicture />,
  },
  {
    icon: Globe,
    badge: "Community",
    title: "Share and",
    accent: "discover prompts",
    body: "Publish your best prompts. Others like, save, comment and fork them, and you climb the weekly leaderboard.",
    points: ["Follow creators you like", "Fork a prompt and make it yours"],
    picture: <DemoStill t={23.4} camera={[690, 300, 1.15]} />,
  },
];

export function Features() {
  return (
    <section id="features" className="px-4 py-24">
      <SectionHeading
        eyebrow="Features"
        title="Everything your prompts"
        accent="need"
        subtitle="From a rough idea to a tested, versioned and shared prompt. All the tools in one workspace."
      />
      <div className="mx-auto mt-20 max-w-6xl space-y-24">
        {FEATURES.map((f, i) => (
          <div key={f.badge} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={cn("space-y-5", i % 2 === 1 && "lg:order-2")}>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
                <f.icon className="size-3.5 text-purple-300" /> {f.badge}
              </span>
              <h3 className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="text-gradient">{f.title}</span>{" "}
                <span className="text-gradient-accent">{f.accent}</span>
              </h3>
              <p className="text-lg text-purple-100/65">{f.body}</p>
              <ul className="space-y-2 text-sm text-purple-100/80">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-purple-400" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className={cn(i % 2 === 1 && "lg:order-1")}>{f.picture}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The versions list and a diff, in the same visual language as the demo. */
function VersionsPicture() {
  const versions = [
    { n: 3, note: "Shorter subject line", when: "2 min ago", latest: true },
    { n: 2, note: "Enhanced with AI", when: "1 hour ago", public: true },
    { n: 1, note: "First draft", when: "yesterday" },
  ];
  return (
    <div
      aria-hidden
      className="grid aspect-[1200/720] grid-cols-[38%_1fr] gap-3 rounded-xl border border-white/10 bg-[#0b0613] p-4 text-left text-xs text-white shadow-[0_0_60px_rgb(168_85_247/0.18)] sm:p-6 sm:text-sm"
    >
      <div className="space-y-2">
        <p className="text-[10px] tracking-widest text-white/40 uppercase">Versions</p>
        {versions.map((v) => (
          <div
            key={v.n}
            className={cn(
              "rounded-lg border px-3 py-2",
              v.latest ? "border-purple-400/60 bg-purple-500/10" : "border-white/10",
            )}
          >
            <p className="flex items-center gap-2 font-semibold">
              v{v.n}
              {v.latest && <span className="text-[10px] font-normal text-white/50">latest</span>}
              {v.public && (
                <span className="rounded-full bg-purple-500/30 px-1.5 text-[10px] text-purple-200">
                  public
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-white/50">{v.note}</p>
            <p className="text-[10px] text-white/30">{v.when}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[10px] tracking-widest text-white/40 uppercase">Changes from v2 to v3</p>
        <p className="font-mono text-[11px] leading-relaxed sm:text-xs">
          Write a short cold email to the founder of a SaaS company.{" "}
          <span className="rounded-sm bg-rose-500/20 text-rose-200 line-through">
            Open with a specific hook, state one clear benefit,
          </span>{" "}
          <span className="rounded-sm bg-emerald-400/15 text-emerald-200">
            Use a subject line under 6 words, open with one specific detail about them,
          </span>{" "}
          and end with a low-friction call to action.
        </p>
        <div className="mt-auto flex gap-2">
          <span className="rounded-md border border-white/15 px-2.5 py-1 text-[11px]">
            Restore v2
          </span>
          <span className="rounded-md bg-purple-600 px-2.5 py-1 text-[11px]">Save as v4</span>
        </div>
      </div>
    </div>
  );
}
