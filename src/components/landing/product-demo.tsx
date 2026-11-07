"use client";

import {
  BookIcon,
  Bookmark,
  Check,
  ChevronDown,
  Folder,
  GitFork,
  Globe,
  Heart,
  LayoutDashboard,
  LibraryIcon,
  Loader2,
  MousePointer2,
  Play,
  Sparkles,
  Star,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/logo";
import { ProviderIcon } from "@/components/provider-icon";
import { cn } from "@/lib/utils";

/*
 * A scripted "screen recording" of the app, drawn in code: a cursor types a prompt,
 * enhances it, runs three models, stars the best answer and publishes it, while the
 * camera zooms in and out. Everything is a pure function of the clock `t` (seconds).
 */

const W = 1200;
const H = 720;
const SCRIPT_END = 25;

// The main script pauses at PICK_AT while the OpenAI dropdown is opened and a model chosen.
const PICK_AT = 10.1;
const PICK = 2.4;
// Hold the last frame for a second, then replay.
const END = 1;
const LOOP = SCRIPT_END + PICK + END;

/** Real clock to main-script clock (frozen during the dropdown and at the end). */
function scriptTime(real: number) {
  if (real < PICK_AT) return real;
  if (real < PICK_AT + PICK) return PICK_AT;
  return Math.min(real - PICK, SCRIPT_END);
}
/** Main-script clock to real clock (for still frames). */
const realTime = (script: number) => (script < PICK_AT ? script : script + PICK);

// The dropdown sequence, in real time. Option rows sit under the OpenAI card's select.
const PICK_CAMERA: Key[] = [
  [PICK_AT, 600, 360, 1],
  [10.6, 420, 265, 1.75],
  [11.9, 420, 265, 1.75],
  [PICK_AT + PICK, 600, 360, 1],
];
const PICK_CURSOR: Key[] = [
  [PICK_AT, 351, 196],
  [10.15, 351, 213],
  [10.6, 351, 213],
  [11.1, 340, 304],
  [11.9, 340, 304],
  [PICK_AT + PICK, 351, 196],
];
const PICK_CLICKS = [10.2, 11.4];
const OPENAI_OPTIONS = [
  { name: "GPT-6 Luna", note: "Fast and cheap" },
  { name: "GPT-6.1 Terra", note: "Most capable" },
];

// ---------- timing helpers ----------
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

type Key = [t: number, ...v: number[]];
/** Eased interpolation between keyframes; holds the first/last value outside the range. */
function track(keys: Key[], t: number) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const [t1, ...b] = keys[i];
    const [t0, ...a] = keys[i - 1];
    if (t <= t1) {
      const p = ease(seg(t, t0, t1));
      return a.map((v, j) => v + (b[j] - v) * p);
    }
  }
  return keys[keys.length - 1].slice(1);
}

// ---------- script ----------
// camera: [t, centerX, centerY, scale]
const CAMERA: Key[] = [
  [0, 600, 360, 1],
  [1.0, 600, 360, 1],
  [1.6, 465, 300, 1.25],
  [3.6, 465, 300, 1.25],
  [4.2, 600, 360, 1],
  [4.8, 600, 360, 1],
  [5.4, 935, 341, 1.45],
  [7.3, 935, 341, 1.45],
  [7.9, 720, 360, 1.1],
  [8.6, 720, 360, 1.1],
  [9.2, 600, 360, 1],
  [12.6, 600, 360, 1],
  [13.2, 700, 449, 1.28],
  [15.9, 700, 449, 1.28],
  [16.5, 600, 360, 1],
  [20.0, 600, 360, 1],
  [20.6, 390, 270, 1.45],
  [23.0, 390, 270, 1.45],
  [23.6, 600, 360, 1],
];

// cursor: [t, x, y]
const CURSOR: Key[] = [
  [0, 640, 560],
  [0.5, 640, 560],
  [0.95, 420, 240],
  [3.6, 420, 240],
  [4.4, 935, 406],
  [7.4, 935, 406],
  [8.0, 782, 486],
  [9.0, 782, 486],
  [9.6, 760, 520],
  [10.1, 351, 196],
  [10.4, 351, 196],
  [10.8, 584, 196],
  [11.1, 584, 196],
  [11.5, 816, 196],
  [11.8, 816, 196],
  [12.3, 1096, 267],
  [16.8, 1096, 267],
  [17.4, 829, 320],
  [17.8, 829, 320],
  [18.4, 1106, 96],
  [19.6, 1106, 96],
  [20.4, 620, 520],
  [22.0, 620, 520],
  [22.6, 265, 340],
  [SCRIPT_END, 265, 340],
];
const CLICKS = [1.0, 4.5, 8.1, 10.9, 11.6, 12.4, 17.5, 18.5, 22.7];

const ROUGH = "write a cold email for my saas, keep it short";
const ENHANCED: [string, boolean][] = [
  ["Write a ", false],
  ["short ", true],
  ["cold email ", false],
  ["to the founder of a SaaS company introducing our analytics tool. ", true],
  [
    "Open with a specific hook, state one clear benefit, and end with a low-friction call to action. ",
    true,
  ],
  ["Keep it under 120 words.", true],
];
const ENHANCED_TEXT = ENHANCED.map(([s]) => s).join("");
// where each piece starts in ENHANCED_TEXT, for the typewriter reveal
const ENHANCED_STARTS = ENHANCED.map((_, i) =>
  ENHANCED.slice(0, i).reduce((n, [s]) => n + s.length, 0),
);

const MODELS = [
  {
    provider: "OpenAI",
    name: "GPT-6.1 Terra",
    meta: "1.9 s · 212 tokens · $0.0004",
    from: 12.6,
    to: 14.4,
    text: "Subject: Quick idea for Acme\n\nHi Sam, saw you shipped usage-based pricing last week. Teams like yours use our analytics to spot accounts about to upgrade. Worth a 15-minute call on Tuesday?",
  },
  {
    provider: "Anthropic",
    name: "Claude Haiku 5.5",
    meta: "2.4 s · 198 tokens · $0.0003",
    from: 12.7,
    to: 15.0,
    text: "Subject: Your pricing launch\n\nHi Sam, congrats on the new pricing page. Do you know which accounts are close to their limit? We flag them before they churn or upgrade. Open to a quick chat this week?",
  },
  {
    provider: "Google",
    name: "Gemini 3.1 Flash Lite",
    meta: "1.6 s · 176 tokens · $0.0002",
    from: 12.8,
    to: 15.8,
    text: "Subject: 3 upgrades hiding in your data\n\nHi Sam, most SaaS teams miss expansion revenue in plain sight. Our tool surfaces it in one dashboard. Could I show you a 10-minute demo on Thursday?",
  },
];

const STEPS = [
  { from: 0, label: "Write it rough" },
  { from: 4.4, label: "Enhance with AI" },
  { from: 9.4, label: "Compare models side by side" },
  { from: 17.0, label: "Keep the best and share it" },
];

// ---------- component ----------
/** Keeps the 1200×720 stage scaled to the frame's width. */
function useFitScale(
  ref: React.RefObject<HTMLDivElement | null>,
  setScale: (scale: number) => void,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // measure now too: ResizeObserver only reports on the next rendering pass
    setScale(el.clientWidth / W);
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, setScale]);
}

/** One frozen frame of the demo, for feature pictures. camera = [centerX, centerY, zoom]. */
export function DemoStill({
  t,
  camera = [600, 360, 1],
}: {
  t: number;
  camera?: [number, number, number];
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useFitScale(frameRef, setScale);
  const [cx, cy, s] = camera;
  return (
    <div
      ref={frameRef}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0b0613] text-left shadow-[0_0_60px_rgb(168_85_247/0.18)]"
      style={{ aspectRatio: `${W} / ${H}` }}
      aria-hidden
    >
      <div
        className="absolute top-0 left-0 origin-top-left transition-opacity duration-500"
        style={{ width: W, height: H, transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${W / 2 - cx * s}px, ${H / 2 - cy * s}px) scale(${s})` }}
        >
          <Stage t={t} real={realTime(t)} />
        </div>
      </div>
    </div>
  );
}
export function ProductDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [t, setT] = useState(0);
  const [reduced, setReduced] = useState(false);

  useFitScale(frameRef, setScale);

  // run the clock only while visible; respect reduced motion
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);

    let raf = 0;
    let visible = false;
    let last = performance.now();
    let clock = 0;
    const tick = (now: number) => {
      clock = (clock + Math.min(now - last, 100) / 1000) % LOOP;
      last = now;
      setT(clock);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || mq.matches || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", sync);
    };
  }, []);

  // reduced motion: a still frame with all three answers and the best one starred
  const real = reduced ? realTime(17.7) : t;
  const now = scriptTime(real);
  const picking = real >= PICK_AT && real < PICK_AT + PICK;
  const [cx, cy, s] = reduced
    ? [600, 360, 1]
    : picking
      ? track(PICK_CAMERA, real)
      : track(CAMERA, now);
  const [mx, my] = picking ? track(PICK_CURSOR, real) : track(CURSOR, now);
  const click = picking
    ? PICK_CLICKS.find((c) => real >= c && real < c + 0.45)
    : CLICKS.find((c) => now >= c && now < c + 0.45);
  const clickClock = picking ? real : now;
  const step = [...STEPS].reverse().find((st) => now >= st.from) ?? STEPS[0];

  return (
    <figure className="mx-auto w-full max-w-6xl text-left" aria-label="IntelliPrompt product demo">
      <div className="relative rounded-2xl border border-white/10 bg-[#120a1f] p-1.5 shadow-[0_0_80px_rgb(168_85_247/0.25)] sm:p-2">
        {/* browser chrome */}
        <div className="flex items-center gap-2 px-3 pt-1.5 pb-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="mx-auto hidden rounded-md bg-white/5 px-10 py-1 text-xs text-white/40 sm:block">
            intelliprompt.vercel.app
          </span>
        </div>

        <div
          ref={frameRef}
          className="relative overflow-hidden rounded-xl bg-[#0b0613]"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left transition-opacity duration-500"
            style={{ width: W, height: H, transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
            aria-hidden
          >
            <div
              className="absolute inset-0 origin-top-left"
              style={{
                transform: `translate(${W / 2 - cx * s}px, ${H / 2 - cy * s}px) scale(${s})`,
              }}
            >
              <Stage t={now} real={real} />
            </div>

            {!reduced && (
              <div
                className="pointer-events-none absolute z-30"
                style={{
                  left: W / 2 + (mx - cx) * s,
                  top: H / 2 + (my - cy) * s,
                }}
              >
                {click !== undefined && (
                  <span
                    className="absolute -top-5 -left-5 size-10 rounded-full border-2 border-purple-300"
                    style={{
                      opacity: 1 - seg(clickClock, click, click + 0.45),
                      transform: `scale(${0.4 + seg(clickClock, click, click + 0.45)})`,
                    }}
                  />
                )}
                <MousePointer2
                  className="size-7 -translate-x-1 -translate-y-1 fill-white text-black drop-shadow-lg"
                  style={{ transform: click !== undefined ? "scale(0.85)" : undefined }}
                />
              </div>
            )}
          </div>
        </div>

        {/* step captions */}
        <figcaption className="flex flex-wrap items-center justify-center gap-2 px-3 pt-3 pb-1.5 sm:gap-3">
          {STEPS.map((st, i) => (
            <span
              key={st.label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors sm:text-sm",
                st === step
                  ? "bg-purple-500/20 text-purple-100"
                  : "hidden text-white/40 sm:inline-flex",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  st === step ? "bg-purple-500 text-white" : "bg-white/10",
                )}
              >
                {i + 1}
              </span>
              {st.label}
            </span>
          ))}
        </figcaption>
      </div>
    </figure>
  );
}

// ---------- the fake app ----------
function Stage({ t, real }: { t: number; real: number }) {
  const scene = t < 9.3 ? 0 : t < 19.4 ? 1 : 2;
  return (
    <div className="absolute inset-0 flex text-white" style={{ fontSize: 14 }}>
      <Sidebar scene={scene} />
      <div className="relative flex-1">
        <div className="flex h-[52px] items-center gap-2 border-b border-white/10 px-6 text-[13px] text-white/50">
          {scene === 2 ? (
            <span className="text-white">Explore</span>
          ) : (
            <>
              Folders <span>›</span> Marketing <span>›</span>
              <span className="text-white">
                {scene === 0 && t < 8.2 ? "New prompt" : "Cold email for SaaS founders"}
              </span>
            </>
          )}
          <span className="ml-auto rounded-full border border-purple-400 px-2 text-[11px] text-purple-300">
            Pro
          </span>
        </div>
        <Fade show={scene === 0}>
          <EditorScene t={t} />
        </Fade>
        <Fade show={scene === 1}>
          <CompareScene t={t} real={real} />
        </Fade>
        <Fade show={scene === 2}>
          <ExploreScene t={t} />
        </Fade>
      </div>
    </div>
  );
}

function Fade({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-x-0 top-[52px] bottom-0 transition-opacity duration-500"
      style={{ opacity: show ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

function Sidebar({ scene }: { scene: number }) {
  const items = [
    { icon: UsersIcon, label: "Explore", active: scene === 2 },
    { icon: TrophyIcon, label: "Leaderboard" },
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: LibraryIcon, label: "My Library" },
    { icon: BookIcon, label: "Blog" },
  ];
  return (
    <div className="flex w-[200px] shrink-0 flex-col gap-1 border-r border-white/10 bg-[#120c1c] p-3 text-[13px]">
      <div className="mb-4 flex items-center gap-2 px-1 pt-1 text-[15px] font-semibold tracking-tight">
        <LogoMark className="size-6" /> IntelliPrompt
      </div>
      <p className="px-2 text-[11px] text-white/40">Main</p>
      {items.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-white/75",
            active && "bg-white/10 text-white",
          )}
        >
          <Icon className="size-4" /> {label}
        </div>
      ))}
      <p className="mt-4 px-2 text-[11px] text-white/40">Folders</p>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-white/75",
          scene !== 2 && "bg-white/10 text-white",
        )}
      >
        <Folder className="size-4" /> Marketing
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-white/75">
        <Folder className="size-4" /> Research
      </div>
      <div className="mt-auto flex items-center gap-2 px-1 pb-1">
        <span className="flex size-7 items-center justify-center rounded-full bg-purple-500/30 text-[11px] font-semibold">
          SK
        </span>
        <span className="text-[12px] leading-tight">
          Sara Khan
          <br />
          <span className="text-white/40">@sara</span>
        </span>
      </div>
    </div>
  );
}

function EditorScene({ t }: { t: number }) {
  const typed = ROUGH.slice(0, Math.round(seg(t, 1.2, 3.4) * ROUGH.length));
  const replaced = t >= 8.2;
  const loading = t >= 4.6 && t < 5.8;
  const result = t >= 5.8 && !replaced;
  const reveal = Math.round(seg(t, 5.8, 6.9) * ENHANCED_TEXT.length);
  const leftText = replaced ? ENHANCED_TEXT : typed;

  return (
    <div className="px-10 pt-7">
      <p className="text-[26px] font-bold">{replaced ? "Version 2" : "Create new prompt"}</p>
      <p className="mt-1 text-[13px] text-white/50">
        Write your first version, enhance it with AI, then test it on models.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-5" style={{ height: 330 }}>
        <div className="flex flex-col">
          <div className="mb-2 flex justify-between text-[13px]">
            <span>Prompt content</span>
            <span className="text-white/40">~{Math.ceil(leftText.length / 4)} tokens</span>
          </div>
          <div
            className={cn(
              "flex-1 rounded-lg border bg-white/[0.03] p-4 text-[14px] leading-relaxed",
              t > 1 && t < 3.6 ? "border-purple-400/60" : "border-white/10",
              replaced && t < 9 && "border-emerald-400/60",
            )}
          >
            {leftText}
            {t > 1 && t < 3.6 && (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-purple-300" />
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2 text-[13px]">
            <span className="size-2 rounded-full bg-purple-400" /> AI enhanced version
          </div>
          <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-white/[0.02]">
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[13px] text-white/60">
                <Loader2 className="size-8 animate-spin text-purple-400" /> Enhancing your prompt…
              </div>
            ) : result ? (
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[12px] text-emerald-300">
                  <Check className="size-3.5" /> Enhanced
                </p>
                <p className="text-[13.5px] leading-relaxed">
                  {ENHANCED.map(([text, added], i) => {
                    const visible = text.slice(0, Math.max(0, reveal - ENHANCED_STARTS[i]));
                    return (
                      <span
                        key={i}
                        className={added ? "rounded-sm bg-emerald-400/15 text-emerald-200" : ""}
                      >
                        {visible}
                      </span>
                    );
                  })}
                </p>
                <div className="mt-auto flex gap-2 text-[12px]">
                  <span
                    className={cn(
                      "rounded-md bg-purple-500 px-3 py-1.5 font-medium",
                      t > 7.9 && "ring-2 ring-purple-300",
                    )}
                  >
                    Replace original
                  </span>
                  <span className="rounded-md border border-white/15 px-3 py-1.5">Re-enhance</span>
                  <span className="px-3 py-1.5 text-white/60">Discard</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <Sparkles className="size-10 text-purple-400/80" />
                <p className="font-semibold">AI enhancement ready</p>
                <p className="max-w-[260px] text-[12px] text-white/50">
                  Let AI make your prompt clearer and more specific. You review every change.
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-full border border-purple-400/50 px-4 py-1.5 text-[13px] text-purple-200",
                    t > 4.3 && "bg-purple-500/20",
                  )}
                >
                  <Sparkles className="size-3.5" /> Enhance with AI
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 inline-flex rounded-md bg-purple-600 px-4 py-2 text-[13px] font-medium">
        {replaced ? "Save as v2" : "Create prompt"}
      </div>
    </div>
  );
}

function CompareScene({ t, real }: { t: number; real: number }) {
  // OpenAI is chosen from its dropdown (real time); the others with one click (script time)
  const picked = [real >= 11.45, t >= 10.9, t >= 11.6];
  const dropdownOpen = real >= 10.25 && real < 11.5;
  const providers = ["OpenAI", "Anthropic", "Google", "Meta"];
  const best = t >= 17.5;
  const published = t >= 18.5;
  return (
    <div className="px-10 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[22px] font-bold">AI model testing</p>
          <p className="mt-1 text-[13px] text-white/50">
            Run this version on up to 4 models and compare.
          </p>
        </div>
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium",
            published ? "bg-emerald-500/20 text-emerald-300" : "bg-purple-600",
          )}
        >
          <Globe className="size-3.5" /> {published ? "Public" : "Publish v2"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {providers.map((p, i) => {
          const on = picked[i];
          return (
            <div
              key={p}
              className={cn(
                "relative rounded-xl border p-3 transition-colors",
                on ? "border-purple-400 bg-purple-500/10" : "border-white/10 bg-white/[0.02]",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-black p-1.5">
                  <ProviderIcon provider={p} className="size-3.5" />
                </span>
                <span className="text-[13px] font-semibold">{p}</span>
                {on && <Check className="ml-auto size-4 text-purple-300" />}
              </div>
              <div
                className={cn(
                  "mt-2 flex items-center justify-between rounded-md border px-2 py-1 text-[12px] text-white/60",
                  i === 0 && dropdownOpen ? "border-purple-400" : "border-white/10",
                )}
              >
                {on ? MODELS[i].name : "Choose model"}
                <ChevronDown className="size-3.5" />
              </div>
              {i === 0 && dropdownOpen && (
                <div className="absolute inset-x-3 top-[calc(100%-6px)] z-20 rounded-md border border-white/15 bg-[#1c1528] p-1 shadow-2xl">
                  {OPENAI_OPTIONS.map((o, j) => (
                    <div
                      key={o.name}
                      className={cn(
                        "flex items-center justify-between rounded px-2 py-1.5",
                        j === 1 && real >= 11.05 && "bg-purple-500/25",
                      )}
                    >
                      <span>
                        <span className="block text-[12px]">{o.name}</span>
                        <span className="block text-[10px] text-white/45">{o.note}</span>
                      </span>
                      {j === 1 && real >= 11.4 && <Check className="size-3.5 text-purple-300" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-[12px] text-white/50">
        Temperature 0.7 · 1,024 tokens
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-[13px] font-medium text-white",
            t >= 12.4 && t < 12.8 && "ring-2 ring-purple-300",
          )}
        >
          <Play className="size-3.5" /> Run 3 models
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {MODELS.map((m, i) => {
          const progress = seg(t, m.from, m.to);
          const started = t >= m.from;
          const done = progress >= 1;
          const isBest = best && i === 1;
          return (
            <div
              key={m.name}
              className={cn(
                "h-[300px] overflow-hidden rounded-xl border p-3 transition-colors",
                isBest ? "border-amber-400/70 bg-amber-400/5" : "border-white/10 bg-white/[0.02]",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <ProviderIcon provider={m.provider} className="size-3.5" /> {m.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {done ? m.meta : started ? "Streaming…" : "Waiting"}
                  </p>
                </div>
                <Star
                  className={cn(
                    "size-4",
                    isBest ? "fill-amber-400 text-amber-400" : "text-white/40",
                  )}
                />
              </div>
              {isBest && (
                <span className="mt-2 inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] text-amber-300">
                  Best answer
                </span>
              )}
              <p className="mt-2 text-[12.5px] leading-relaxed whitespace-pre-line text-white/80">
                {m.text.slice(0, Math.round(progress * m.text.length))}
                {started && !done && (
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-purple-300" />
                )}
              </p>
            </div>
          );
        })}
      </div>

      {published && (
        <div
          className="absolute right-8 bottom-6 flex items-center gap-2 rounded-lg border border-white/10 bg-[#1c1528] px-4 py-2.5 text-[13px] shadow-xl"
          style={{ opacity: seg(t, 18.5, 18.8) }}
        >
          <Check className="size-4 text-emerald-400" /> v2 is now public
        </div>
      )}
    </div>
  );
}

function ExploreScene({ t }: { t: number }) {
  const grow = seg(t, 20.4, 22.6);
  const liked = t >= 22.7;
  const cards = [
    {
      title: "Cold email for SaaS founders",
      by: "@sara",
      tags: ["marketing", "email"],
      likes: Math.round(grow * 24) + (liked ? 1 : 0),
      saves: Math.round(grow * 9),
      forks: Math.round(grow * 3),
      text: "Write a short cold email to the founder of a SaaS company introducing our analytics tool…",
      mine: true,
    },
    {
      title: "Explain this code like a senior engineer",
      by: "@intelliprompt",
      tags: ["coding"],
      likes: 41,
      saves: 17,
      forks: 6,
      text: "Explain what this code does, why it's written this way, and what could go wrong…",
    },
    {
      title: "Build a 4-week study plan",
      by: "@intelliprompt",
      tags: ["learning"],
      likes: 33,
      saves: 21,
      forks: 4,
      text: "Create a realistic 4-week plan to learn the topic below, with one goal per week…",
    },
  ];
  return (
    <div className="px-10 pt-6">
      <p className="text-[22px] font-bold">Explore community</p>
      <p className="mt-1 text-[13px] text-white/50">
        Prompts tested across models and shared by the people who wrote them.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className={cn(
              "rounded-xl border p-4",
              c.mine ? "border-purple-400/70 bg-purple-500/10" : "border-white/10 bg-white/[0.02]",
            )}
          >
            <p className="text-[11px] text-white/50">{c.by}</p>
            <p className="mt-1 text-[15px] font-semibold">{c.title}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-white/60">{c.text}</p>
            <div className="mt-3 flex gap-1.5">
              {c.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-[12px] text-white/70">
              <span className="flex items-center gap-1">
                <Heart className={cn("size-4", c.mine && liked && "fill-rose-500 text-rose-500")} />
                {c.likes}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="size-4" /> {c.saves}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="size-4" /> {c.forks}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[13px] text-amber-200"
        style={{ opacity: seg(t, 21, 21.5) }}
      >
        <TrophyIcon className="size-4" /> Climbing the leaderboard: +3 per like, +2 per save, +5 per
        fork
      </div>
    </div>
  );
}
