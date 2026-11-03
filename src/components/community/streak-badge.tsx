import { Flame } from "lucide-react";

export function StreakBadge({ days }: { days: number }) {
  if (days < 1) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-sm font-medium text-orange-600 dark:text-orange-400"
      title="Days in a row with a run, enhance or publish"
    >
      <Flame className="size-4" /> {days}-day streak
    </span>
  );
}
