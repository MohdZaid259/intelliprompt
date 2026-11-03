import { diffWords } from "diff";

/** Word-level diff: removed text struck through in red, added text in green. */
export function VersionDiff({ before, after }: { before: string; after: string }) {
  const parts = diffWords(before, after);
  if (parts.every((p) => !p.added && !p.removed)) {
    return <p className="text-muted-foreground text-sm">No changes.</p>;
  }
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.added ? (
          <ins
            key={i}
            className="rounded bg-green-500/15 text-green-700 no-underline dark:text-green-400"
          >
            {part.value}
          </ins>
        ) : part.removed ? (
          <del key={i} className="rounded bg-red-500/15 text-red-700 dark:text-red-400">
            {part.value}
          </del>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  );
}
