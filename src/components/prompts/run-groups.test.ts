import { describe, expect, it } from "vitest";
import { groupRuns } from "./run-groups";
import type { WorkspaceRun } from "./types";

const run = (id: string, modelId: string, isBest = false): WorkspaceRun => ({
  id,
  versionId: "v1",
  modelId,
  temperature: 0.7,
  status: "ok",
  output: id,
  error: null,
  inputTokens: 1,
  outputTokens: 1,
  costUsd: 0,
  latencyMs: 1,
  isBest,
});

const ids = (runs: WorkspaceRun[]) => runs.map((r) => r.id);

describe("groupRuns", () => {
  it("shows one card per model: the newest answer", () => {
    // newest first, as the server returns them
    const { current, earlier } = groupRuns([run("haiku-2", "haiku"), run("gpt-1", "gpt"), run("haiku-1", "haiku")]);
    expect(ids(current)).toEqual(["haiku-2", "gpt-1"]);
    expect(ids(earlier)).toEqual(["haiku-1"]);
  });

  it("keeps a starred answer visible after the model is re-run", () => {
    const { current, earlier } = groupRuns([
      run("haiku-3", "haiku"),
      run("haiku-2", "haiku", true),
      run("haiku-1", "haiku"),
    ]);
    expect(ids(current)).toEqual(["haiku-3", "haiku-2"]);
    expect(ids(earlier)).toEqual(["haiku-1"]);
  });

  it("handles no runs", () => {
    expect(groupRuns([])).toEqual({ current: [], earlier: [] });
  });
});
