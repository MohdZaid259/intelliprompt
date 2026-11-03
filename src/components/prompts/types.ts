import type { ModelInfo } from "@/config/models";

export type WorkspacePrompt = { id: string; title: string; tags: string[] };

export type WorkspaceVersion = {
  id: string;
  number: number;
  content: string;
  note: string;
  source: "manual" | "enhanced" | "restored" | "fork";
  createdAt: Date;
};

export type WorkspaceRun = {
  id: string;
  versionId: string;
  modelId: string;
  temperature: number;
  status: "ok" | "error";
  output: string;
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: string | number;
  latencyMs: number;
  isBest: boolean;
};

export type WorkspaceModel = ModelInfo & { locked: boolean };

export type WorkspaceLimits = { runsPerDay: number; runsUsed: number; maxTokens: number };
