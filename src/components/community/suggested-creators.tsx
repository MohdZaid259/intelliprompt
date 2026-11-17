import Link from "next/link";
import { db } from "@/server/db";
import { suggestCreators } from "@/server/data/social";
import { FollowButton } from "./follow-button";
import { UserAvatar } from "./user-avatar";

/** Shown on an empty Following feed: people to follow, rather than a dead end. */
export async function SuggestedCreators({ viewerId }: { viewerId: string }) {
  const creators = await suggestCreators(db(), viewerId);

  return (
    <div className="rounded-lg border border-dashed p-6 sm:p-8">
      <p className="text-center font-medium">Nothing from people you follow yet</p>
      {creators.length === 0 ? (
        <p className="text-muted-foreground mt-1 text-center text-sm">
          Find authors on the Latest tab and follow them.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mt-1 text-center text-sm">
            Follow a few people and their new prompts will show up here.
          </p>
          <ul className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
            {creators.map((c) => (
              <li key={c.id} className="bg-card flex items-center gap-3 rounded-lg border p-3">
                <UserAvatar user={c} className="size-9" />
                <Link href={`/u/${c.username}`} className="min-w-0 flex-1 hover:underline">
                  <span className="block truncate text-sm font-medium">
                    {c.name || `@${c.username}`}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {c.publicPrompts} public prompt{c.publicPrompts === 1 ? "" : "s"}
                  </span>
                </Link>
                <FollowButton userId={c.id} following={false} followers={0} signedIn compact />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
