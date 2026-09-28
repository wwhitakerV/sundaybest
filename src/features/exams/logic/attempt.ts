import type { ExamAttempt, ExamAttemptItem, ExamResponse } from "@/types/domain";

import { getExamItemResponse, isExamResponseComplete } from "@/core/store/exam-responses";
import type { ExamAnswerKey, ExamQuestion } from "../types";

/** The questions as an attempt takes them: IDs, versions, concepts, and the options a response may use. */
export function toAttemptItems(questions: readonly ExamQuestion[]): ExamAttemptItem[] {
  return questions.map((question): ExamAttemptItem => {
    const base = {
      questionId: question.id,
      version: question.version,
      primaryConceptId: question.primaryConceptId,
    };
    switch (question.kind) {
      case "single_choice":
      case "true_false":
      case "multiple_select":
        return { ...base, kind: question.kind, choiceIds: question.choices.map((c) => c.id) };
      case "matching":
        return {
          ...base,
          kind: "matching",
          promptIds: question.prompts.map((p) => p.id),
          targetIds: question.targets.map((t) => t.id),
        };
      case "ordering":
        return { ...base, kind: "ordering", stepIds: question.steps.map((s) => s.id) };
    }
  });
}

/** Whether a question counts as done: complete in an Exam attempt, checked in a Study one. */
function isItemDone(attempt: ExamAttempt, item: ExamAttemptItem): boolean {
  const entry = getExamItemResponse(attempt, item.questionId);
  return attempt.mode === "study"
    ? entry?.check != null
    : isExamResponseComplete(item, entry?.response);
}

/** How many questions are done. */
export function getDoneCount(attempt: ExamAttempt): number {
  return attempt.items.filter((item) => isItemDone(attempt, item)).length;
}

/** The numbers (from 1) of the questions not done yet. */
export function getUndoneNumbers(attempt: ExamAttempt): number[] {
  return attempt.items.flatMap((item, index) => (isItemDone(attempt, item) ? [] : [index + 1]));
}

/** Where to pick up: the first question not done, or the first question if all are. */
export function getResumeIndex(attempt: ExamAttempt): number {
  const index = attempt.items.findIndex((item) => !isItemDone(attempt, item));
  return Math.max(index, 0);
}

/**
 * A response or key in words, for the results: the choice or choices, each
 * pairing, or the order. Null for no response.
 */
export function describeAnswer(
  question: ExamQuestion,
  answer: ExamResponse | ExamAnswerKey | null,
): string | null {
  if (!answer) return null;
  const labelOf = (options: readonly { id: string; label: string }[], id: string) =>
    options.find((entry) => entry.id === id)?.label ?? id;
  switch (question.kind) {
    case "single_choice":
    case "true_false":
    case "multiple_select": {
      const ids =
        "choiceId" in answer ? [answer.choiceId] : "choiceIds" in answer ? answer.choiceIds : [];
      return ids.length ? ids.map((id) => labelOf(question.choices, id)).join("; ") : null;
    }
    case "matching": {
      const pairs = "pairs" in answer ? answer.pairs : [];
      return pairs.length
        ? pairs
            .map(
              (pair) =>
                `${labelOf(question.prompts, pair.promptId)} → ${labelOf(question.targets, pair.targetId)}`,
            )
            .join("; ")
        : null;
    }
    case "ordering": {
      const ids = "stepIds" in answer ? answer.stepIds : [];
      return ids.length
        ? ids.map((id, index) => `${index + 1}. ${labelOf(question.steps, id)}`).join("; ")
        : null;
    }
  }
}
