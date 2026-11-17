"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Question = { question: string; options: string[] };
/** question → chosen option */
export type Answers = Record<string, string>;

/**
 * A few quick, tappable questions before enhancing. Not a form: one tap per question,
 * every question optional, and "Skip" enhances straight away.
 */
export function ClarifyQuestions({
  questions,
  answers,
  onChange,
  onSubmit,
  onSkip,
}: {
  questions: Question[];
  answers: Answers;
  onChange: (answers: Answers) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const pick = (question: string, option: string) => {
    const next = { ...answers };
    // tapping the chosen option again clears it
    if (next[question] === option) delete next[question];
    else next[question] = option;
    onChange(next);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <p className="text-sm font-semibold">A few quick questions</p>
        <p className="text-muted-foreground text-xs">
          Tap what fits. It makes the enhanced prompt match what you actually want.
        </p>
      </div>
      <div className="space-y-3">
        {questions.map(({ question, options }) => (
          <fieldset key={question} className="space-y-1.5">
            <legend className="mb-1.5 text-sm">{question}</legend>
            <div className="flex flex-wrap gap-1.5">
              {options.map((option) => {
                const chosen = answers[question] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => pick(question, option)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      chosen
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onSubmit}>
          <Sparkles /> Enhance
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onSkip}>
          Skip questions
        </Button>
      </div>
    </div>
  );
}
