import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { APICallError, type LanguageModel } from "ai";

export type ModelFactory = (key: string, modelId: string, fallback?: string) => LanguageModel;

/** Primary key first, then optional failover keys you own (e.g. a backup if one is revoked). */
export function openRouterKeys(): string[] {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    ...(process.env.OPENROUTER_FALLBACK_KEYS ?? "").split(","),
  ]
    .map((k) => k?.trim())
    .filter((k): k is string => !!k);
  if (keys.length === 0) throw new Error("OPENROUTER_API_KEY is not set");
  return keys;
}

export const openRouterModel: ModelFactory = (key, modelId, fallback) =>
  createOpenRouter({ apiKey: key, appName: "IntelliPrompt" })(modelId, {
    usage: { include: true },
    ...(fallback ? { models: [modelId, fallback] } : {}),
  });

/** Errors that mean "this key can't be used right now", so the next key is worth trying. */
export function isKeyError(error: unknown) {
  return APICallError.isInstance(error) && [401, 402, 403, 429].includes(error.statusCode ?? 0);
}

export function errorMessage(error: unknown) {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) return "The model is busy right now. Try again in a moment.";
    if (error.statusCode === 402) return "AI credits are exhausted. Please try again later.";
    return `The model returned an error (${error.statusCode ?? "unknown"}).`;
  }
  return "Something went wrong while running the model.";
}

export function costFrom(providerMetadata: unknown): number {
  const cost = (providerMetadata as { openrouter?: { usage?: { cost?: number } } } | undefined)
    ?.openrouter?.usage?.cost;
  return typeof cost === "number" ? cost : 0;
}
