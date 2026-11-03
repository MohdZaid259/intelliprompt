import { APICallError, simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import type { ModelFactory } from "./client";
import { enhancePrompt } from "./enhance";
import { runModel } from "./run";

const usage = (input: number, output: number) => ({
  inputTokens: { total: input, noCache: input, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: output, text: output, reasoning: undefined },
});

function streamingModel(chunks: string[], opts: { failAfterText?: boolean } = {}) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start" as const, id: "t" },
          ...chunks.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
          ...(opts.failAfterText
            ? [{ type: "error" as const, error: rateLimited() }]
            : [
                { type: "text-end" as const, id: "t" },
                {
                  type: "finish" as const,
                  finishReason: { unified: "stop" as const, raw: undefined },
                  usage: usage(12, 34),
                  providerMetadata: { openrouter: { usage: { cost: 0.0021 } } },
                },
              ]),
        ],
      }),
    }),
  });
}

const rateLimited = () =>
  new APICallError({
    message: "rate limited",
    url: "https://openrouter.ai",
    requestBodyValues: {},
    statusCode: 429,
    isRetryable: false,
  });

const failingModel = () =>
  new MockLanguageModelV4({
    doStream: async () => {
      throw rateLimited();
    },
  });

const base = { prompt: "Say hi", modelId: "test/model", temperature: 0.7, maxTokens: 100 };

describe("runModel", () => {
  it("streams deltas and reports usage and cost", async () => {
    const deltas: string[] = [];
    const outcome = await runModel({
      ...base,
      keys: ["k1"],
      createModel: () => streamingModel(["Hel", "lo"]),
      onDelta: (t) => deltas.push(t),
    });

    expect(deltas).toEqual(["Hel", "lo"]);
    expect(outcome).toMatchObject({
      status: "ok",
      aborted: false,
      output: "Hello",
      error: null,
      inputTokens: 12,
      outputTokens: 34,
      costUsd: 0.0021,
    });
  });

  it("fails over to the next key when the first is rate limited before any text", async () => {
    const used: string[] = [];
    const createModel: ModelFactory = (key) => {
      used.push(key);
      return key === "k1" ? failingModel() : streamingModel(["ok"]);
    };
    const outcome = await runModel({ ...base, keys: ["k1", "k2"], createModel, onDelta: () => {} });

    expect(used).toEqual(["k1", "k2"]);
    expect(outcome).toMatchObject({ status: "ok", output: "ok" });
  });

  it("does not retry once text has streamed, and reports a friendly error", async () => {
    const used: string[] = [];
    const outcome = await runModel({
      ...base,
      keys: ["k1", "k2"],
      createModel: (key) => {
        used.push(key);
        return streamingModel(["partial"], { failAfterText: true });
      },
      onDelta: () => {},
    });

    expect(used).toEqual(["k1"]);
    expect(outcome.status).toBe("error");
    expect(outcome.output).toBe("partial");
    expect(outcome.error).toMatch(/busy/);
  });

  it("marks a run the client stopped as aborted, not ok", async () => {
    const controller = new AbortController();
    controller.abort();
    const outcome = await runModel({
      ...base,
      keys: ["k1"],
      createModel: () => streamingModel(["never"]),
      signal: controller.signal,
      onDelta: () => {},
    });
    expect(outcome).toMatchObject({ status: "error", aborted: true });
  });

  it("reports an error when every key fails", async () => {
    const outcome = await runModel({
      ...base,
      keys: ["k1", "k2"],
      createModel: () => failingModel(),
      onDelta: () => {},
    });
    expect(outcome).toMatchObject({ status: "error", output: "" });
  });
});

describe("enhancePrompt", () => {
  it("returns the improved prompt and change notes", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              prompt: "Summarize {text} in 3 bullet points for a busy executive.",
              changes: ["Added audience", "Specified format"],
            }),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: usage(50, 40),
        warnings: [],
      }),
    });

    const result = await enhancePrompt("summarize {text}", {
      keys: ["k1"],
      createModel: () => model,
    });
    expect(result).toMatchObject({
      prompt: "Summarize {text} in 3 bullet points for a busy executive.",
      changes: ["Added audience", "Specified format"],
      inputTokens: 50,
      outputTokens: 40,
    });
  });
});
