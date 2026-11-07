// Publishes the curated starter prompts under the official @intelliprompt account, each with
// a real best answer from a model. Idempotent: prompts that already exist are skipped.
//
//   npm run seed                               # uses .env.local
//   npm run seed -- --env .env.production.local  # production database (OpenRouter key still from .env.local)
import { existsSync } from "node:fs";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { and, eq } from "drizzle-orm";
import { ENHANCER_MODEL } from "@/config/models";
import { createDb } from "@/server/db/client";
import { prompts, runs, users, versions } from "@/server/db/schema";
import { STARTER_PROMPTS } from "./starter-prompts";

const envFlag = process.argv.indexOf("--env");
const envFiles = [envFlag > -1 ? process.argv[envFlag + 1] : null, ".env.local"];
// earlier files win: loadEnvFile never overrides a variable that's already set
for (const file of envFiles) if (file && existsSync(file)) process.loadEnvFile(file);

const OFFICIAL = {
  id: "intelliprompt_official",
  username: "intelliprompt",
  name: "IntelliPrompt",
  email: "",
  avatarUrl: "/logo.png",
  bio: "Curated starter prompts from the IntelliPrompt team. Fork any of them to make it yours.",
};
const MODEL = ENHANCER_MODEL.id; // fast, cheap and good at following instructions
const MAX_TOKENS = 4096;

async function main() {
  const url = process.env.DATABASE_URL;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!url || !apiKey) throw new Error("DATABASE_URL and OPENROUTER_API_KEY are required");
  console.log(`Seeding ${new URL(url).host}`);

  const db = createDb(url);
  const model = createOpenRouter({ apiKey, appName: "IntelliPrompt" })(MODEL, {
    usage: { include: true },
  });

  await db.insert(users).values(OFFICIAL).onConflictDoNothing();

  let created = 0;
  let totalCost = 0;
  for (const starter of STARTER_PROMPTS) {
    const existing = await db.query.prompts.findFirst({
      where: and(eq(prompts.ownerId, OFFICIAL.id), eq(prompts.title, starter.title)),
    });
    if (existing) {
      console.log(`skip  ${starter.title}`);
      continue;
    }

    const started = Date.now();
    const result = await generateText({
      model,
      prompt: starter.content,
      temperature: 0.7,
      maxOutputTokens: MAX_TOKENS,
      // same as the app (src/server/ai/client.ts): short hidden reasoning, not returned
      providerOptions: { openrouter: { reasoning: { effort: "low", exclude: true } } },
    });
    // a cut-off answer would look broken as a featured "best answer"
    if (result.finishReason === "length") {
      throw new Error(`"${starter.title}" hit the ${MAX_TOKENS}-token limit; shorten the prompt`);
    }
    const cost =
      (result.finalStep.providerMetadata as { openrouter?: { usage?: { cost?: number } } })
        ?.openrouter?.usage?.cost ?? 0;
    totalCost += cost;

    // one transaction per prompt, so a failure never leaves a half-published starter
    await db.transaction(async (tx) => {
      const [prompt] = await tx
        .insert(prompts)
        .values({ ownerId: OFFICIAL.id, title: starter.title, tags: starter.tags })
        .returning({ id: prompts.id });
      const [version] = await tx
        .insert(versions)
        .values({ promptId: prompt.id, number: 1, content: starter.content })
        .returning({ id: versions.id });
      await tx.insert(runs).values({
        versionId: version.id,
        userId: OFFICIAL.id,
        modelId: MODEL,
        temperature: 0.7,
        maxTokens: MAX_TOKENS,
        status: "ok",
        output: result.text,
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
        costUsd: cost.toFixed(6),
        latencyMs: Date.now() - started,
        isBest: true,
      });
      await tx
        .update(prompts)
        .set({ visibility: "public", bestVersionId: version.id, publishedAt: new Date() })
        .where(eq(prompts.id, prompt.id));
    });
    created++;
    console.log(`added ${starter.title} (${result.usage.outputTokens} tokens)`);
  }

  console.log(
    `Done: ${created} added, ${STARTER_PROMPTS.length - created} already there, cost $${totalCost.toFixed(4)}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
