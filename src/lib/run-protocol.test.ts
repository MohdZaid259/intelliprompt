import { describe, expect, it } from "vitest";
import { parseTags, timeAgo, formatCost, formatLatency } from "./format";
import { parseRunStream, TRAILER, type RunSummary } from "./run-protocol";

const summary: RunSummary = {
  id: "r1",
  status: "ok",
  error: null,
  inputTokens: 1,
  outputTokens: 2,
  costUsd: 0.001,
  latencyMs: 900,
};

describe("parseRunStream", () => {
  it("returns partial text while streaming", () => {
    expect(parseRunStream("Hello wor")).toEqual({ text: "Hello wor", summary: null });
  });

  it("splits the answer from the trailing summary", () => {
    const received = "Hello world" + TRAILER + JSON.stringify(summary);
    expect(parseRunStream(received)).toEqual({ text: "Hello world", summary });
  });
});

describe("format helpers", () => {
  it("formats cost and latency", () => {
    expect(formatCost("0")).toBe("$0");
    expect(formatCost(0.00042)).toBe("$0.0004");
    expect(formatCost(1.5)).toBe("$1.50");
    expect(formatLatency(850)).toBe("850 ms");
    expect(formatLatency(2340)).toBe("2.3 s");
  });

  it("describes relative time", () => {
    const now = Date.parse("2026-11-03T12:00:00Z");
    expect(timeAgo("2026-11-03T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-11-03T09:00:00Z", now)).toBe("3 hours ago");
    expect(timeAgo("2026-11-02T12:00:00Z", now)).toBe("yesterday");
  });

  it("parses comma separated tags", () => {
    expect(parseTags(" writing, , Marketing ")).toEqual(["writing", "Marketing"]);
  });
});
