import type {
  ExamAttempt,
  ExamAttemptItem,
  ExamItemResponse,
  ExamResponse,
  Id,
} from "@/types/domain";

/**
 * The rules for a response to one exam question, against the question as
 * the attempt took it (`ExamAttemptItem`). Shared by the store — which
 * refuses a response that breaks them — and the exam screens, which use them
 * to count what's answered. Pure; no answer key is ever involved.
 */

function isDistinct(ids: readonly Id[]): boolean {
  return new Set(ids).size === ids.length;
}

function allWithin(ids: readonly Id[], allowed: readonly Id[]): boolean {
  return ids.every((id) => allowed.includes(id));
}

/**
 * Whether `response` fits `item`: the same kind, only the item's own IDs, and
 * nothing used twice — no choice, prompt, target, or step. A partial
 * response (some prompts paired, some steps placed) still fits.
 */
export function isExamResponseValid(item: ExamAttemptItem, response: ExamResponse): boolean {
  if (response.kind !== item.kind) return false;
  switch (response.kind) {
    case "single_choice":
    case "true_false":
      return "choiceIds" in item && item.choiceIds.includes(response.choiceId);
    case "multiple_select":
      return (
        "choiceIds" in item &&
        isDistinct(response.choiceIds) &&
        allWithin(response.choiceIds, item.choiceIds)
      );
    case "matching": {
      if (!("promptIds" in item)) return false;
      const promptIds = response.pairs.map((pair) => pair.promptId);
      const targetIds = response.pairs.map((pair) => pair.targetId);
      return (
        isDistinct(promptIds) &&
        isDistinct(targetIds) &&
        allWithin(promptIds, item.promptIds) &&
        allWithin(targetIds, item.targetIds)
      );
    }
    case "ordering":
      return (
        "stepIds" in item &&
        isDistinct(response.stepIds) &&
        allWithin(response.stepIds, item.stepIds)
      );
  }
}

/**
 * Whether `response` answers `item` fully: a choice picked, at least one of
 * several selected, every prompt paired, every step placed. Anything less
 * counts as unanswered — and, once submitted, as incorrect.
 */
export function isExamResponseComplete(
  item: ExamAttemptItem,
  response: ExamResponse | null | undefined,
): boolean {
  if (!response || !isExamResponseValid(item, response)) return false;
  switch (response.kind) {
    case "single_choice":
    case "true_false":
      return true;
    case "multiple_select":
      return response.choiceIds.length > 0;
    case "matching":
      return "promptIds" in item && response.pairs.length === item.promptIds.length;
    case "ordering":
      return "stepIds" in item && response.stepIds.length === item.stepIds.length;
  }
}

/** The latest response to one question in an attempt, or null. */
export function getExamItemResponse(attempt: ExamAttempt, questionId: Id): ExamItemResponse | null {
  return attempt.responses.find((entry) => entry.questionId === questionId) ?? null;
}

/**
 * Whether a question's answer may be shown: every question once the attempt
 * is finished, and a Study question once it's been checked. Never in an Exam
 * attempt still under way.
 */
export function isExamQuestionRevealed(attempt: ExamAttempt, questionId: Id): boolean {
  if (attempt.status === "completed") return true;
  return attempt.mode === "study" && getExamItemResponse(attempt, questionId)?.check != null;
}

/** The primary concepts a finished attempt missed, once each, in question order. */
export function getMissedConcepts(attempt: ExamAttempt): string[] {
  const missed = new Set(
    (attempt.result?.items ?? []).filter((item) => !item.correct).map((item) => item.questionId),
  );
  const concepts = attempt.items
    .filter((item) => missed.has(item.questionId))
    .map((item) => item.primaryConceptId);
  return [...new Set(concepts)];
}
