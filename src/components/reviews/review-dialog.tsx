"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/server/actions/reviews";

export type MyReview = { rating: number; body: string; headline: string; approved: boolean };

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const MAX = 500;

/** Write or edit your review. Reviews appear on the landing page after approval. */
export function ReviewDialog({
  open,
  onOpenChange,
  review,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: MyReview | null;
}) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(review?.body ?? "");
  const [headline, setHeadline] = useState(review?.headline ?? "");
  const [pending, startTransition] = useTransition();
  const shown = hover || rating;

  const submit = () =>
    startTransition(async () => {
      const res = await submitReviewAction({ rating, body, headline });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Thanks for your review! It will appear once approved.");
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {review ? "Edit your review" : "How is IntelliPrompt working for you?"}
          </DialogTitle>
          <DialogDescription>
            Your review helps others decide and helps us improve. Approved reviews appear on our
            home page with your name and photo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label="Rating"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2"
                >
                  <Star
                    className={cn(
                      "size-7 transition-colors",
                      n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
              <span className="text-muted-foreground ml-2 text-sm">{LABELS[shown]}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-body">Your review</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX))}
              rows={5}
              placeholder="What do you use IntelliPrompt for, and what has it changed for you?"
            />
            <p className="text-muted-foreground text-right text-xs">
              {body.trim().length}/{MAX}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-headline">
              What you do <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="review-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value.slice(0, 60))}
              placeholder="e.g. Content writer, Bengaluru"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || rating === 0 || body.trim().length < 20}>
            {pending ? "Sending…" : review ? "Update review" : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A button that opens the review dialog (used on the dashboard). */
export function ReviewButton({
  review,
  ...props
}: { review: MyReview | null } & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button {...props} onClick={() => setOpen(true)} />
      {open && <ReviewDialog open={open} onOpenChange={setOpen} review={review} />}
    </>
  );
}
