import type { Metadata } from "next";
import { NewPromptForm } from "@/components/prompts/new-prompt-form";

export const metadata: Metadata = { title: "New prompt" };

export default function NewPromptPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New prompt</h1>
      <NewPromptForm />
    </div>
  );
}
