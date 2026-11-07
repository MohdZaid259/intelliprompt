import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marks a feature we've planned but not built yet. */
export function SoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-600 uppercase dark:text-sky-400",
        className,
      )}
    >
      <Clock className="size-3" /> Coming soon
    </span>
  );
}
