import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { ENHANCER_MODEL } from "@/config/models";
import { costFrom, isKeyError, openRouterOptions, type ModelFactory } from "./client";

const INSTRUCTIONS = `You are an expert prompt engineer. Rewrite the user's prompt so a language model produces a better answer.

Rules:
- Keep the user's intent, language, and any placeholders like {text} exactly.
- Make the task, audience, constraints, and desired output format explicit where they are vague.
- If the user answered clarifying questions, build those answers into the prompt; they override your own guesses.
- Add a role or context only when it clearly helps. Do not invent facts the user did not give.
- Keep it as short as it can be while being unambiguous. Never answer the prompt itself.

Return the improved prompt and 2-4 change notes. Each note is a short phrase of at most 8 words, naming what you added or changed, e.g. "Added a 120-word limit" or "Set a warm, friendly tone". No explanations or full sentences.`;

const CLARIFY_INSTRUCTIONS = `You help people improve a prompt before it is rewritten. Read the user's prompt and find the 2-4 decisions that would most change the best version of it, where the prompt doesn't already say: for example the goal or output type (a finished artifact, a quick answer, code), the audience, the length, the tone or the format.

For each, write a very short question (max 6 words) and 2-4 short answer options (1-4 words each) the user can tap. Options must be concrete and different from each other. Ask in the same language as the prompt.

If the prompt is already specific enough, return an empty list. Never answer the prompt itself.`;

const schema = z.object({
  prompt: z.string().min(1).describe("The improved prompt, ready to use"),
  changes: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("2-4 scannable phrases (max 8 words each) naming what changed"),
});

const clarifySchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1).describe("Very short question, max 6 words"),
        options: z.array(z.string().min(1)).min(2).max(4).describe("2-4 tappable answers"),
      }),
    )
    .max(4),
});

export type ClarifyingQuestion = z.infer<typeof clarifySchema>["questions"][number];
/** What the user picked: question text → chosen option. */
export type ClarifyingAnswers = { question: string; answer: string }[];

type Usage = { inputTokens: number; outputTokens: number; costUsd: number };
export type Enhancement = z.infer<typeof schema> & Usage;
export type Clarification = { questions: ClarifyingQuestion[] } & Usage;

type Opts = { keys: string[]; createModel: ModelFactory; userId?: string };

/** Runs one structured call, moving to the next API key when a key is refused. */
async function structured<T extends z.ZodType>(
  opts: Opts,
  call: { instructions: string; prompt: string; schema: T; maxOutputTokens: number },
): Promise<z.infer<T> & Usage> {
  let lastError: unknown;
  for (const key of opts.keys) {
    try {
      const result = await generateText({
        model: opts.createModel(key, ENHANCER_MODEL.id, ENHANCER_MODEL.fallback),
        instructions: call.instructions,
        prompt: call.prompt,
        output: Output.object({ schema: call.schema }),
        temperature: 0.4,
        maxOutputTokens: call.maxOutputTokens,
        maxRetries: 1,
        providerOptions: openRouterOptions(opts.userId),
      });
      return {
        ...(result.output as z.infer<T> & object),
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

/** The prompt text sent to the enhancer, with any clarifying answers appended. */
export function enhancerInput(original: string, answers: ClarifyingAnswers = []) {
  const picked = answers.filter((a) => a.answer.trim());
  if (picked.length === 0) return original;
  return `${original}\n\n---\nThe user answered these clarifying questions:\n${picked
    .map((a) => `- ${a.question} ${a.answer}`)
    .join("\n")}`;
}

export function enhancePrompt(
  original: string,
  opts: Opts & { answers?: ClarifyingAnswers },
): Promise<Enhancement> {
  return structured(opts, {
    instructions: INSTRUCTIONS,
    prompt: enhancerInput(original, opts.answers),
    schema,
    maxOutputTokens: 2048,
  });
}

/** A few quick, tappable questions that would most change the enhanced prompt. */
export function clarifyPrompt(original: string, opts: Opts): Promise<Clarification> {
  return structured(opts, {
    instructions: CLARIFY_INSTRUCTIONS,
    prompt: original,
    schema: clarifySchema,
    maxOutputTokens: 600,
  });
}
