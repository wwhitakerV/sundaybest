import type { ExamAttempt, ExamResult } from "@/types/domain";

import { getExamItemResponse, isExamResponseComplete } from "@/core/store/exam-responses";
import type { ExamRules, QuestionReveal } from "../types";
import { getBandLabel } from "./get-band-label";
import { getConceptResults } from "./concept-results";
import { isResponseCorrect } from "./grade-response";

/**
 * An attempt's graded result, from its questions' keys: each question right
 * or wrong — unanswered or incomplete counts as wrong — the score and its
 * band, and each concept's evidence. A Study attempt isn't scored (no band),
 * and only an Exam Mode first attempt counts as evidence for a concept.
 */
export function buildExamResult(input: {
  attempt: ExamAttempt;
  reveals: readonly QuestionReveal[];
  rules: ExamRules;
}): ExamResult {
  const { attempt, reveals, rules } = input;
  const items = attempt.items.map((item) => {
    const response = getExamItemResponse(attempt, item.questionId)?.response ?? null;
    const key = reveals.find((reveal) => reveal.questionId === item.questionId)?.key;
    const answered = isExamResponseComplete(item, response);
    return {
      questionId: item.questionId,
      correct: answered && key !== undefined && isResponseCorrect(key, response),
      answered,
    };
  });
  const correct = items.filter((item) => item.correct).length;
  const total = items.length;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
  const scored = attempt.mode === "exam";

  return {
    correct,
    total,
    percentage,
    band: scored ? getBandLabel(percentage, rules.bands) : null,
    items,
    concepts: getConceptResults(
      attempt.items.map((item, index) => ({
        primaryConceptId: item.primaryConceptId,
        correct: items.at(index)?.correct ?? false,
      })),
      {
        independent: scored && !attempt.practice,
        minimumObservations: rules.conceptMinimumObservations,
      },
    ),
  };
}
