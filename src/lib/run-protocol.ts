import { z } from "zod";

// /api/run streams plain text, then TRAILER followed by a JSON summary of the saved run.
export const TRAILER = "\u001e";

export const runRequestSchema = z.object({
  versionId: z.uuid(),
  modelId: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(64).max(4096).default(1024),
});

export type RunRequest = z.input<typeof runRequestSchema>;

export type RunSummary = {
  id: string;
  status: "ok" | "error";
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
};

/**
 * Splits what the client received so far into the answer text and (once complete) the summary.
 * The server strips TRAILER from model output, and the summary may arrive split across chunks,
 * so an incomplete summary is simply "not yet".
 */
export function parseRunStream(received: string): { text: string; summary: RunSummary | null } {
  const at = received.lastIndexOf(TRAILER);
  if (at === -1) return { text: received, summary: null };
  try {
    return {
      text: received.slice(0, at),
      summary: JSON.parse(received.slice(at + TRAILER.length)) as RunSummary,
    };
  } catch {
    return { text: received.slice(0, at), summary: null };
  }
}
