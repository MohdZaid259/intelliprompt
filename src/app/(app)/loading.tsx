import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the moment a link inside the app is clicked, while the next page loads.
 * Without it a click looked like it did nothing until the server answered.
 */
export default function AppLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
