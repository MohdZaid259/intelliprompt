"use client";

import { Star } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/server/actions/reviews";

export type AdminReview = {
  id: string;
  rating: number;
  body: string;
  headline: string;
  approved: boolean;
  author: { name: string; username: string };
};

/** Approve, hide or delete member reviews before they reach the landing page. */
export function ReviewModeration({ reviews }: { reviews: AdminReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-muted-foreground text-sm">No reviews yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
    </ul>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  const [pending, startTransition] = useTransition();
  const act = (action: "approve" | "hide" | "delete") =>
    startTransition(async () => {
      const res = await moderateReviewAction({ id: review.id, action });
      if (!res.ok) toast.error(res.error);
    });

  return (
    <li className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{review.author.name || `@${review.author.username}`}</span>
        <span className="text-muted-foreground">@{review.author.username}</span>
        <span className="flex items-center gap-0.5 text-amber-500">
          {review.rating} <Star className="size-3.5 fill-current" />
        </span>
        <Badge variant={review.approved ? "default" : "secondary"} className="ml-auto">
          {review.approved ? "Live" : "Waiting"}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed">{review.body}</p>
      {review.headline && <p className="text-muted-foreground text-xs">{review.headline}</p>}
      <div className="flex gap-2">
        {review.approved ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => act("hide")}>
            Hide
          </Button>
        ) : (
          <Button size="sm" disabled={pending} onClick={() => act("approve")}>
            Approve
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("delete")}>
          Delete
        </Button>
      </div>
    </li>
  );
}
