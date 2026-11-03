// Curated launch lineup (OpenRouter ids). `fallback` is tried by OpenRouter when the primary is down.
// Retired ids are hidden automatically by the daily check in src/server/ai/models.ts.
export type ModelTier = "free" | "pro";

export type ModelInfo = {
  id: string;
  label: string;
  provider: string;
  tier: ModelTier;
  fallback?: string;
};

export const MODELS: ModelInfo[] = [
  {
    id: "openai/gpt-6-luna",
    label: "GPT-6 Luna",
    provider: "OpenAI",
    tier: "free",
    fallback: "openai/gpt-5.6-luna",
  },
  {
    id: "anthropic/claude-haiku-5.5",
    label: "Claude Haiku 5.5",
    provider: "Anthropic",
    tier: "free",
  },
  {
    id: "google/gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    provider: "Google",
    tier: "free",
    fallback: "google/gemma-4-31b-it",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    label: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    tier: "free",
    fallback: "deepseek/deepseek-v4-flash-0731",
  },
  {
    id: "qwen/qwen3.8-flash",
    label: "Qwen 3.8 Flash",
    provider: "Qwen",
    tier: "free",
    fallback: "qwen/qwen3.7-flash",
  },
  { id: "mistralai/mistral-small-2603", label: "Mistral Small", provider: "Mistral", tier: "free" },
  {
    id: "meta-llama/llama-4-maverick",
    label: "Llama 4 Maverick",
    provider: "Meta",
    tier: "free",
    fallback: "meta-llama/llama-4-scout",
  },

  { id: "openai/gpt-6.1-terra", label: "GPT-6.1 Terra", provider: "OpenAI", tier: "pro" },
  {
    id: "anthropic/claude-sonnet-5.5",
    label: "Claude Sonnet 5.5",
    provider: "Anthropic",
    tier: "pro",
  },
  {
    id: "google/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "Google",
    tier: "pro",
    fallback: "google/gemini-3.7-flash",
  },
  {
    id: "x-ai/grok-4.7",
    label: "Grok 4.7",
    provider: "xAI",
    tier: "pro",
    fallback: "x-ai/grok-4.6",
  },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", provider: "DeepSeek", tier: "pro" },
  { id: "mistralai/mistral-large-4-0", label: "Mistral Large 4", provider: "Mistral", tier: "pro" },
];

export const ENHANCER_MODEL = { id: "anthropic/claude-haiku-5.5", fallback: "openai/gpt-6-luna" };

export function findModel(id: string) {
  return MODELS.find((m) => m.id === id);
}

export function canUseModel(model: ModelInfo, planTier: ModelTier) {
  return model.tier === "free" || planTier === "pro";
}
