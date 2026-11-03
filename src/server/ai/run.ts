import "server-only";
import { streamText } from "ai";
import { costFrom, errorMessage, isKeyError, type ModelFactory } from "./client";

export type RunOutcome = {
  status: "ok" | "error";
  output: string;
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
};

export type RunOptions = {
  prompt: string;
  modelId: string;
  fallback?: string;
  temperature: number;
  maxTokens: number;
  keys: string[];
  createModel: ModelFactory;
  userId?: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
};

/**
 * Streams one model's answer. If a key fails (auth, credits, rate limit) before any text
 * arrived, the next key is tried; once text has streamed, errors are reported as-is.
 */
export async function runModel(opts: RunOptions): Promise<RunOutcome> {
  const started = Date.now();
  let output = "";
  let lastError: unknown = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  for (const key of opts.keys) {
    lastError = null;
    const result = streamText({
      model: opts.createModel(key, opts.modelId, opts.fallback),
      prompt: opts.prompt,
      temperature: opts.temperature,
      maxOutputTokens: opts.maxTokens,
      maxRetries: 1,
      abortSignal: opts.signal,
      providerOptions: opts.userId ? { openrouter: { user: opts.userId } } : undefined,
    });

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        output += part.text;
        opts.onDelta(part.text);
      } else if (part.type === "finish-step") {
        inputTokens += part.usage.inputTokens ?? 0;
        outputTokens += part.usage.outputTokens ?? 0;
        costUsd += costFrom(part.providerMetadata);
      } else if (part.type === "error") {
        lastError = part.error;
      }
    }

    if (!(lastError && output === "" && isKeyError(lastError))) break;
  }

  const failed = lastError !== null || (output === "" && !opts.signal?.aborted);
  return {
    status: failed ? "error" : "ok",
    output,
    error: failed
      ? lastError
        ? errorMessage(lastError)
        : "The model returned an empty answer."
      : null,
    inputTokens,
    outputTokens,
    costUsd,
    latencyMs: Date.now() - started,
  };
}
