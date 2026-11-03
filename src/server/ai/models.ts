import "server-only";
import { cacheLife } from "next/cache";
import { MODELS } from "@/config/models";

/**
 * Model ids from our lineup that OpenRouter still serves. Checked at most daily, so a retired
 * model disappears from the picker instead of failing at run time (the v1 problem).
 */
export async function getActiveModelIds(): Promise<string[]> {
  "use cache";
  cacheLife("days");

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error(`OpenRouter models: ${res.status}`);
    const { data } = (await res.json()) as { data: { id: string }[] };
    const live = new Set(data.map((m) => m.id));
    return MODELS.filter((m) => live.has(m.id)).map((m) => m.id);
  } catch {
    // if the check itself fails, don't hide everything
    return MODELS.map((m) => m.id);
  }
}
