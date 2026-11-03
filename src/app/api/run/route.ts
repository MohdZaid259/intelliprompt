import { canUseModel, findModel } from "@/config/models";
import { PLANS } from "@/config/plans";
import { runRequestSchema, TRAILER, type RunSummary } from "@/lib/run-protocol";
import { getUser } from "@/server/auth";
import { openRouterKeys, openRouterModel } from "@/server/ai/client";
import { getActiveModelIds } from "@/server/ai/models";
import { runModel } from "@/server/ai/run";
import { db } from "@/server/db";
import { getRunnableVersion } from "@/server/data/prompts";
import { touchStreak } from "@/server/data/engagement";
import { insertRun } from "@/server/data/runs";
import { recordCost, releaseQuota, reserveQuota } from "@/server/quota";

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Runs one prompt version on one model and streams the answer.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return fail(401, "Please sign in.");

  const parsed = runRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  const { versionId, modelId, temperature } = parsed.data;

  const plan = PLANS[user.plan];
  const model = findModel(modelId);
  if (!model || !(await getActiveModelIds()).includes(modelId)) {
    return fail(400, "That model isn't available.");
  }
  if (!canUseModel(model, plan.modelTier)) return fail(403, `${model.label} is a Pro model.`);
  const maxTokens = Math.min(parsed.data.maxTokens, plan.maxTokens);

  const version = await getRunnableVersion(db(), user.id, versionId);
  if (!version) return fail(404, "Prompt not found.");

  if (!(await reserveQuota(db(), user.id, "runs", plan.runsPerDay))) {
    return fail(429, `You've used all ${plan.runsPerDay} runs for today.`);
  }

  const keys = openRouterKeys();
  const encoder = new TextEncoder();

  async function execute(send: (text: string) => void): Promise<RunSummary> {
    const outcome = await runModel({
      prompt: version!.content,
      modelId,
      fallback: model!.fallback,
      temperature,
      maxTokens,
      keys,
      createModel: openRouterModel,
      userId: user!.id,
      signal: req.signal,
      onDelta: send,
    });

    // Saved before the stream closes, so the client can rely on it existing.
    const run = await insertRun(db(), {
      versionId,
      userId: user!.id,
      modelId,
      temperature,
      maxTokens,
      status: outcome.status,
      output: outcome.output,
      error: outcome.error,
      inputTokens: outcome.inputTokens,
      outputTokens: outcome.outputTokens,
      costUsd: outcome.costUsd.toFixed(6),
      latencyMs: outcome.latencyMs,
    });
    if (outcome.status === "error") await releaseQuota(db(), user!.id, "runs");
    else await touchStreak(db(), user!.id);
    await recordCost(db(), user!.id, outcome.costUsd);

    return {
      id: run.id,
      status: outcome.status,
      error: outcome.error,
      inputTokens: outcome.inputTokens,
      outputTokens: outcome.outputTokens,
      costUsd: outcome.costUsd,
      latencyMs: outcome.latencyMs,
    };
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The client may disconnect mid-answer; keep going so the run is still saved.
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {}
      };
      try {
        const summary = await execute(send);
        send(TRAILER + JSON.stringify(summary));
        controller.close();
      } catch (error) {
        console.error("run failed", error);
        await releaseQuota(db(), user.id, "runs");
        try {
          controller.error(error);
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
