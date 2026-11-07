import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MODELS } from "@/config/models";
import { openRouterKeys, openRouterModel } from "./client";
import { enhancePrompt } from "./enhance";
import { runModel } from "./run";

// Real OpenRouter calls (costs a fraction of a cent). Opt in: OPENROUTER_LIVE_TEST=1 npm test
const live = process.env.OPENROUTER_LIVE_TEST === "1";
if (live && existsSync(".env.local")) process.loadEnvFile(".env.local");

describe.skipIf(!live)("OpenRouter live", () => {
  it("streams an answer with usage and cost from every free-tier model", async () => {
    const free = MODELS.filter((m) => m.tier === "free");
    const outcomes = await Promise.all(
      free.map(async (m) => {
        let deltas = 0;
        const outcome = await runModel({
          prompt: "Reply with exactly: OK",
          modelId: m.id,
          fallback: m.fallback,
          temperature: 0,
          maxTokens: 64,
          keys: openRouterKeys(),
          createModel: openRouterModel,
          onDelta: () => void deltas++,
        });
        return { id: m.id, deltas, ...outcome };
      }),
    );
    for (const o of outcomes) {
      console.log(
        `${o.status.padEnd(5)} ${o.id.padEnd(32)} ${o.latencyMs}ms in=${o.inputTokens} out=${o.outputTokens} $${o.costUsd} ${o.error ?? JSON.stringify(o.output.slice(0, 20))}`,
      );
    }
    for (const o of outcomes) {
      expect(o.status, o.id).toBe("ok");
      expect(o.deltas, o.id).toBeGreaterThan(0);
      expect(o.outputTokens, o.id).toBeGreaterThan(0);
    }
  }, 120_000);

  it("enhances a prompt into structured output", async () => {
    const result = await enhancePrompt("write blog about dogs", {
      keys: openRouterKeys(),
      createModel: openRouterModel,
    });
    console.log(
      "enhanced:",
      result.prompt.slice(0, 160),
      "|",
      result.changes,
      "| $",
      result.costUsd,
    );
    expect(result.prompt.length).toBeGreaterThan(20);
    expect(result.changes.length).toBeGreaterThan(0);
  }, 60_000);
});
