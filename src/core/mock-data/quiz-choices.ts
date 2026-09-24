import type { Id, QuizChoice } from "@/types/domain";

const LABELS = ["A", "B", "C", "D"] as const;

/** A question's lettered choices, each with an ID built from the question's. */
export function makeChoices(questionId: Id, texts: readonly string[]): QuizChoice[] {
  return texts.map((text, index) => {
    const label = LABELS.at(index) ?? String(index + 1);
    return { id: `${questionId}-${label.toLowerCase()}`, label, text };
  });
}
