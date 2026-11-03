"use client";

import { Heart, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/format";
import {
  addCommentAction,
  deleteCommentAction,
  toggleCommentLikeAction,
} from "@/server/actions/community";
import { useGoToSignIn } from "./sign-in-redirect";
import { ToggleCount } from "./toggle-count";
import { UserAvatar } from "./user-avatar";

export type CommentView = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; username: string; avatarUrl: string };
  likes: number;
  likedByViewer: boolean;
};

export function Comments({
  promptId,
  promptOwnerId,
  comments,
  viewerId,
}: {
  promptId: string;
  promptOwnerId: string;
  comments: CommentView[];
  viewerId: string | null;
}) {
  return (
    <section id="comments" className="space-y-4">
      <h2 className="text-lg font-semibold">
        Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
      </h2>
      <CommentForm promptId={promptId} signedIn={!!viewerId} />
      <ul className="space-y-4">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            signedIn={!!viewerId}
            canDelete={viewerId === c.author.id || viewerId === promptOwnerId}
          />
        ))}
      </ul>
    </section>
  );
}

function CommentForm({ promptId, signedIn }: { promptId: string; signedIn: boolean }) {
  const goToSignIn = useGoToSignIn();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Button variant="outline" onClick={goToSignIn}>
        Sign in to comment
      </Button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addCommentAction({ promptId, body });
      if (result.ok) setBody("");
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        placeholder="What worked for you? Any tweaks?"
        aria-label="Comment"
      />
      <Button type="submit" size="sm" disabled={pending || !body.trim()}>
        {pending && <Loader2 className="animate-spin" />} Comment
      </Button>
    </form>
  );
}

function CommentItem({
  comment,
  signedIn,
  canDelete,
}: {
  comment: CommentView;
  signedIn: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteCommentAction({ commentId: comment.id });
      if (!result.ok) toast.error(result.error);
    });

  return (
    <li className="flex gap-3">
      <UserAvatar user={comment.author} className="mt-0.5 size-8" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link href={`/u/${comment.author.username}`} className="font-medium hover:underline">
            @{comment.author.username}
          </Link>
          <span className="text-muted-foreground"> · {timeAgo(comment.createdAt)}</span>
        </p>
        {/* plain text: comments are never rendered as HTML or markdown */}
        <p className="text-sm break-words whitespace-pre-wrap">{comment.body}</p>
        <div className="-ml-2 flex items-center">
          <ToggleCount
            initial={{ active: comment.likedByViewer, count: comment.likes }}
            label="Like comment"
            activeLabel="Unlike comment"
            icon={Heart}
            activeClassName="fill-red-500 text-red-500"
            signedIn={signedIn}
            action={() => toggleCommentLikeAction({ commentId: comment.id })}
          />
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground px-2"
              onClick={remove}
              disabled={pending}
              aria-label="Delete comment"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
