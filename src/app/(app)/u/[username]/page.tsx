import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeedList, FeedSkeletonGrid } from "@/components/community/feed-list";
import { FollowButton } from "@/components/community/follow-button";
import { StreakBadge } from "@/components/community/streak-badge";
import { UserAvatar } from "@/components/community/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/server/auth";
import { db } from "@/server/db";
import { liveStreak } from "@/server/data/engagement";
import { getProfile } from "@/server/data/social";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default function ProfilePage({ params, searchParams }: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Profile({
  params,
  searchParams,
}: {
  params: PageProps<"/u/[username]">["params"];
  searchParams: PageProps<"/u/[username]">["searchParams"];
}) {
  const [{ username }, query, viewer] = await Promise.all([params, searchParams, getUser()]);
  const profile = await getProfile(db(), username.toLowerCase(), viewer?.id ?? null);
  if (!profile) notFound();
  const page = Math.max(1, Number(query.page) || 1);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start gap-6">
        <UserAvatar user={profile} className="size-20 text-lg" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-semibold">{profile.name || `@${profile.username}`}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
          <StreakBadge days={liveStreak(profile)} />
          {profile.bio && <p className="max-w-prose">{profile.bio}</p>}
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <Stat label="published" value={profile.published} />
            <Stat
              label={profile.likesReceived === 1 ? "like received" : "likes received"}
              value={profile.likesReceived}
            />
            <Stat label="following" value={profile.following} />
          </div>
          {profile.isSelf ? (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">{profile.followers}</span> followers ·
              this is your public profile
            </p>
          ) : (
            <FollowButton
              userId={profile.id}
              following={profile.isFollowing}
              followers={profile.followers}
              signedIn={!!viewer}
            />
          )}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Published prompts</h2>
        <Suspense fallback={<FeedSkeletonGrid />}>
          <FeedList
            viewerId={viewer?.id ?? null}
            options={{ authorId: profile.id }}
            page={page}
            pageHref={(p) => `/u/${profile.username}${p > 1 ? `?page=${p}` : ""}`}
            empty={<p className="text-muted-foreground text-sm">Nothing published yet.</p>}
          />
        </Suspense>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <p>
      <span className="text-foreground font-medium tabular-nums">{value}</span> {label}
    </p>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex gap-6">
      <Skeleton className="size-20 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
