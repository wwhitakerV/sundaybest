import type { ExamAttempt, ExamResponse, ExamResult, Id } from "@/types/domain";

import { buildExamResult } from "../logic/build-result";
import { isResponseCorrect } from "../logic/grade-response";
import type { QuestionReveal } from "../types";
import { getTheologyExam, THEOLOGY_EXAM_ID } from "./bundled-exams";

/**
 * The grading seam: the only code that reads answer keys. It grades on the
 * device from the bundled content today; a trusted service can take its
 * place without the screens or the store changing (ADR 0013). Callers ask
 * for a reveal only once that answer may be shown.
 */

/** A bundled exam that parsed, by its ID — or null. */
function bundledExam(examId: string) {
  const parsed = examId === THEOLOGY_EXAM_ID ? getTheologyExam() : null;
  return parsed?.ok ? parsed : null;
}

function revealsFor(examId: string): QuestionReveal[] | null {
  return bundledExam(examId)?.reveals ?? null;
}

/** A question's key, rationales, feedback, and teaching — or null for an exam or question that isn't there. */
export function getQuestionReveal(examId: string, questionId: Id): QuestionReveal | null {
  return revealsFor(examId)?.find((reveal) => reveal.questionId === questionId) ?? null;
}

/** Whether a Study answer is right — or null for an exam or question that isn't there. */
export function checkAnswer(
  examId: string,
  questionId: Id,
  response: ExamResponse,
): boolean | null {
  const reveal = getQuestionReveal(examId, questionId);
  return reveal ? isResponseCorrect(reveal.key, response) : null;
}

/** A finished attempt's graded result — or null for an exam that isn't there. */
export function gradeAttempt(attempt: ExamAttempt): ExamResult | null {
  const parsed = bundledExam(attempt.examId);
  return parsed
    ? buildExamResult({ attempt, reveals: parsed.reveals, rules: parsed.exam.rules })
    : null;
}

/** A concept's name, from the teaching of the first question that observes it; the ID if none. */
export function getConceptTitle(examId: string, conceptId: string): string {
  const question = bundledExam(examId)?.exam.questions.find(
    (entry) => entry.primaryConceptId === conceptId,
  );
  const reveal = question ? getQuestionReveal(examId, question.id) : null;
  return reveal?.teaching.title ?? conceptId;
}
