import type { QuestionResult, QuizStatus } from "@/core/store";
import type { Id, QuizQuestion } from "@/types/domain";

/**
 * How a choice looks:
 * - `idle` — not picked; `selected` — picked, not yet checked.
 * - once the question's checked: `correct` (the right answer, picked or
 *   not), `incorrect` (a wrong pick), or `faded` (every other choice).
 */
export type ChoiceLook = "idle" | "selected" | "correct" | "incorrect" | "faded";

/**
 * How one choice shows, from the question's state: the choice picked now,
 * the choice the answer was checked with (null until checked), and the
 * question's right one. Whether the answer was right is the store's to say
 * (`getQuestionResult`); this only lays the reveal out choice by choice.
 */
export function getChoiceLook(input: {
  choiceId: Id;
  selectedChoiceId: Id | null;
  answeredChoiceId: Id | null;
  correctChoiceId: Id;
}): ChoiceLook {
  const { choiceId, selectedChoiceId, answeredChoiceId, correctChoiceId } = input;
  if (answeredChoiceId === null) return choiceId === selectedChoiceId ? "selected" : "idle";
  if (choiceId === correctChoiceId) return "correct";
  return choiceId === answeredChoiceId ? "incorrect" : "faded";
}

/** What the Quick Check's one button does now. */
export type QuickCheckAction = {
  kind: "start" | "check" | "next" | "finish" | "done";
  label: string;
  testID: string;
  enabled: boolean;
};

/**
 * The button for where the user is: start a quiz not taken; check a picked
 * answer (not before one's picked); move on once it's checked, or to the
 * score after the last question; and Done on the score.
 */
export function getQuickCheckAction(input: {
  status: QuizStatus;
  result: QuestionResult;
  hasSelection: boolean;
  isLastQuestion: boolean;
}): QuickCheckAction {
  const { status, result, hasSelection, isLastQuestion } = input;
  if (status === "notStarted") {
    return { kind: "start", label: "Start", testID: "quick-check-start-button", enabled: true };
  }
  if (status === "completed") {
    return { kind: "done", label: "Done", testID: "quick-check-done-button", enabled: true };
  }
  if (result === "unanswered") {
    return {
      kind: "check",
      label: "Check answer",
      testID: "quick-check-check-button",
      enabled: hasSelection,
    };
  }
  return isLastQuestion
    ? {
        kind: "finish",
        label: "See your score",
        testID: "quick-check-finish-button",
        enabled: true,
      }
    : { kind: "next", label: "Next question", testID: "quick-check-next-button", enabled: true };
}

/** The line over a question: where it's from, or that it's a verse to finish. */
export function getQuestionKicker(question: Pick<QuizQuestion, "kind" | "source">): string {
  if (question.kind === "finishTheVerse") return "Finish the verse";
  return question.source === "sermon" ? "From the sermon" : "From Scripture";
}

const BLANK = "___";
const INSTRUCTION = /^\s*finish the verse:\s*/i;
const QUOTES = /^[“"]|[”"]$/g;

/**
 * A finish-the-verse prompt as the verse either side of its blank, without
 * the "Finish the verse:" instruction or the quote marks round it — or null
 * for a prompt with no blank.
 */
export function splitVersePrompt(prompt: string): { before: string; after: string } | null {
  const verse = prompt.replace(INSTRUCTION, "").trim().replace(QUOTES, "");
  const at = verse.indexOf(BLANK);
  if (at === -1) return null;
  return { before: verse.slice(0, at), after: verse.slice(at + BLANK.length) };
}

/** The score's headline: celebrating all right, encouraging most, inviting another look otherwise. */
export function getScoreHeadline({ correct, total }: { correct: number; total: number }): string {
  if (total > 0 && correct === total) return "You know this one";
  return correct * 2 >= total && correct > 0 ? "Nearly there" : "Worth another look";
}

/**
 * What a screen reader says for a choice: its letter and words, then — once
 * the question's checked — whether it was the user's answer and whether
 * it's right.
 */
export function describeChoice(
  choice: { label: string; text: string },
  look: ChoiceLook,
  picked: boolean,
): string {
  const base = `${choice.label}. ${choice.text}.`;
  if (look === "correct") return `${base} ${picked ? "Your answer, right." : "The right answer."}`;
  if (look === "incorrect") return `${base} Your answer, not right.`;
  return base;
}
