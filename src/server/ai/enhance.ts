import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { ENHANCER_MODEL } from "@/config/models";
import { costFrom, isKeyError, type ModelFactory } from "./client";

const INSTRUCTIONS = `You are an expert prompt engineer. Rewrite the user's prompt so a language model produces a better answer.

Rules:
- Keep the user's intent, language, and any placeholders like {text} exactly.
- Make the task, audience, constraints, and desired output format explicit where they are vague.
- Add a role or context only when it clearly helps. Do not invent facts the user did not give.
- Keep it as short as it can be while being unambiguous. Never answer the prompt itself.

Return the improved prompt and 2-5 short bullet points describing what you changed and why.`;

const schema = z.object({
  prompt: z.string().min(1).describe("The improved prompt, ready to use"),
  changes: z.array(z.string()).min(1).max(5).describe("Short notes on what changed and why"),
});

export type Enhancement = z.infer<typeof schema> & {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export async function enhancePrompt(
  original: string,
  opts: { keys: string[]; createModel: ModelFactory; userId?: string },
): Promise<Enhancement> {
  let lastError: unknown;
  for (const key of opts.keys) {
    try {
      const result = await generateText({
        model: opts.createModel(key, ENHANCER_MODEL.id, ENHANCER_MODEL.fallback),
        instructions: INSTRUCTIONS,
        prompt: original,
        output: Output.object({ schema }),
        temperature: 0.4,
        maxOutputTokens: 2048,
        maxRetries: 1,
        providerOptions: opts.userId ? { openrouter: { user: opts.userId } } : undefined,
      });
      return {
        ...result.output,
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
        costUsd: costFrom(result.finalStep.providerMetadata),
      };
    } catch (error) {
      lastError = error;
      if (!isKeyError(error)) break;
    }
  }
  throw lastError;
}
