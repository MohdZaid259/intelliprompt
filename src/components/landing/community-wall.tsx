import { Heart } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { db } from "@/server/db";
import { listPublicPrompts, type FeedItem } from "@/server/data/community";
import { SectionHeading } from "./section-heading";

const MIN_ITEMS = 4;
// The account that publishes the starter prompts (scripts/seed-starters.ts).
const OFFICIAL_USERNAME = "intelliprompt";

async function topPrompts() {
  "use cache";
  cacheLife("hours");
  try {
    return await listPublicPrompts(db(), { sort: "top", limit: 16 });
  } catch {
    return []; // e.g. a build without a database
  }
}

/**
 * Two scrolling rows of real public prompts. Hidden until the community has a few,
 * so the landing page never shows an empty or padded wall.
 */
export async function CommunityWall() {
  const top = await topPrompts();
  if (top.length < MIN_ITEMS) return null;
  // real members' prompts first; the starter prompts fill in until there are enough
  const items = [
    ...top.filter((i) => i.author.username !== OFFICIAL_USERNAME),
    ...top.filter((i) => i.author.username === OFFICIAL_USERNAME),
  ];

  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];

  return (
    <section className="py-20 sm:py-28">
      <div className="px-4">
        <SectionHeading
          eyebrow="Community"
          title="What people are"
          accent="building"
          subtitle="Prompts tested across models and shared by the community."
        />
      </div>
      <div className="group mt-14 space-y-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex overflow-hidden">
            {/* the row is rendered twice so the loop is seamless; the copy is hidden from screen readers */}
            <ul
              className={`flex shrink-0 gap-6 pr-6 group-hover:[animation-play-state:paused] ${r === 0 ? "animate-marquee-left" : "animate-marquee-right"}`}
            >
              {[...row, ...row].map((item, i) => (
                <WallCard key={`${item.id}-${i}`} item={item} hidden={i >= row.length} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function WallCard({ item, hidden }: { item: FeedItem; hidden: boolean }) {
  const official = item.author.username === OFFICIAL_USERNAME;
  const initials = (item.author.name || item.author.username)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <li aria-hidden={hidden || undefined} className="w-[22rem] shrink-0 sm:w-[28rem]">
      <Link
        href={`/p/${item.id}`}
        tabIndex={hidden ? -1 : undefined}
        className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-purple-400/40"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm text-purple-300">
            <Heart className="size-4 fill-purple-400 text-purple-400" /> {item.likes}
          </span>
          {item.tags[0] && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
              {item.tags[0]}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <p className="font-medium text-white">{item.title}</p>
          <p className="line-clamp-3 text-sm leading-relaxed text-white/55">{item.preview}</p>
        </div>
        {official ? (
          <div className="mt-auto flex items-center gap-2 text-sm text-white/50">
            <LogoMark className="size-5" /> Starter prompt
          </div>
        ) : (
          <div className="mt-auto flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-purple-500/25 text-xs font-medium text-white">
              {initials}
            </span>
            <span>
              <span className="block text-sm font-medium text-white">
                {item.author.name || `@${item.author.username}`}
              </span>
              <span className="block text-xs text-white/50">@{item.author.username}</span>
            </span>
          </div>
        )}
      </Link>
    </li>
  );
}
