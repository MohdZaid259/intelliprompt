import { Heart } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { db } from "@/server/db";
import { listPublicPrompts, type FeedItem } from "@/server/data/community";
import { SectionHeading } from "./section-heading";

const MIN_ITEMS = 4;

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
  const items = await topPrompts();
  if (items.length < MIN_ITEMS) return null;

  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];

  return (
    <section className="py-24">
      <div className="px-4">
        <SectionHeading
          eyebrow="Community"
          title="What people are"
          accent="building"
          subtitle="Real prompts, tested across models and shared by the people who wrote them."
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
        className="flex h-full flex-col gap-4 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/50 to-[#0d0716] p-6 transition-colors hover:border-purple-400/50"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm text-purple-300">
            <Heart className="size-4 fill-purple-400 text-purple-400" /> {item.likes}
          </span>
          {item.tags[0] && (
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-purple-300 uppercase">
              {item.tags[0]}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-white">{item.title}</p>
          <p className="line-clamp-3 text-sm leading-relaxed text-purple-100/60">
            “{item.preview}”
          </p>
        </div>
        <div className="mt-auto flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-700 text-sm font-semibold text-white">
            {initials}
          </span>
          <span>
            <span className="block text-sm font-medium text-white">
              {item.author.name || `@${item.author.username}`}
            </span>
            <span className="block text-xs text-purple-100/50">@{item.author.username}</span>
          </span>
        </div>
      </Link>
    </li>
  );
}
