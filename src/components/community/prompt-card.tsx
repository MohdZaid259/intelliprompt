import { GitFork, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import type { FeedItem } from "@/server/data/community";
import { LikeButton, SaveButton } from "./engagement";
import { ShareMenu } from "./share-menu";
import { UserAvatar } from "./user-avatar";

export function PromptCard({
  item,
  liked,
  saved,
  signedIn,
}: {
  item: FeedItem;
  liked: boolean;
  saved: boolean;
  signedIn: boolean;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Link
          href={`/u/${item.author.username}`}
          className="flex items-center gap-2 hover:underline"
        >
          <UserAvatar user={item.author} />
          <span className="text-foreground font-medium">@{item.author.username}</span>
        </Link>
        {item.publishedAt && <span>· {timeAgo(item.publishedAt)}</span>}
      </div>

      <Link href={`/p/${item.id}`} className="group space-y-2">
        <h2 className="font-semibold group-hover:underline">{item.title}</h2>
        <p className="text-muted-foreground line-clamp-3 font-mono text-xs whitespace-pre-wrap">
          {item.preview}
        </p>
      </Link>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <Link key={t} href={`/explore?tag=${encodeURIComponent(t)}`}>
              <Badge variant="secondary">{t}</Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-auto -ml-2 flex flex-wrap items-center">
        <LikeButton promptId={item.id} liked={liked} count={item.likes} signedIn={signedIn} />
        <SaveButton promptId={item.id} saved={saved} count={item.saves} signedIn={signedIn} />
        <Link
          href={`/p/${item.id}#comments`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 text-sm"
          aria-label={`${item.comments} comments`}
        >
          <MessageCircle className="size-4" /> {item.comments}
        </Link>
        <span
          className="text-muted-foreground flex items-center gap-1.5 px-2 text-sm"
          aria-label={`${item.forks} forks`}
        >
          <GitFork className="size-4" /> {item.forks}
        </span>
        <ShareMenu promptId={item.id} title={item.title} count={item.shares} signedIn={signedIn} />
      </div>
    </article>
  );
}
