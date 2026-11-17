import type { WorkspaceRun } from "./types";

/**
 * Splits a version's saved runs (newest first) into the cards to show and the older ones.
 * Each model shows only its newest answer, so re-running a model replaces its card.
 * A starred answer always stays visible, even if the model was re-run after it.
 */
export function groupRuns(runs: WorkspaceRun[]): {
  current: WorkspaceRun[];
  earlier: WorkspaceRun[];
} {
  const seen = new Set<string>();
  const current: WorkspaceRun[] = [];
  const earlier: WorkspaceRun[] = [];
  for (const run of runs) {
    if (!seen.has(run.modelId) || run.isBest) current.push(run);
    else earlier.push(run);
    seen.add(run.modelId);
  }
  return { current, earlier };
}
