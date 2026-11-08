import { Star } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { listApprovedReviews, REVIEWS_TAG, type PublicReview } from "@/server/data/reviews";
import { SectionHeading } from "./section-heading";

// Below this the section stays hidden: a wall of one or two reviews looks emptier than none.
const MIN_REVIEWS = 3;

async function approvedReviews() {
  "use cache";
  cacheLife("hours");
  cacheTag(REVIEWS_TAG);
  try {
    return await listApprovedReviews(db(), 24);
  } catch {
    return []; // e.g. a build without a database
  }
}

/** Reviews written by members in the app and approved by an admin. */
export async function Reviews() {
  const reviews = await approvedReviews();
  if (reviews.length < MIN_REVIEWS) return null;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="px-4 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Reviews"
        title="Loved by people who"
        accent="write prompts"
        subtitle={`Rated ${average.toFixed(1)} out of 5 by ${reviews.length} members.`}
      />
      <ul className="mx-auto mt-14 max-w-6xl columns-1 gap-6 sm:columns-2 lg:columns-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </ul>
    </section>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const name = review.author.name || `@${review.author.username}`;
  const initials = name
    .replace("@", "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <li className="mb-6 break-inside-avoid rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={
              n <= review.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-white/20"
            }
          />
        ))}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-white/75">{review.body}</p>
      <div className="mt-5 flex items-center gap-3">
        {review.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatars come from Clerk's CDN
          <img src={review.author.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-purple-500/25 text-xs font-medium text-white">
            {initials}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-white">{name}</span>
          <span className="block truncate text-xs text-white/50">
            {review.headline || `@${review.author.username}`}
          </span>
        </span>
      </div>
    </li>
  );
}
