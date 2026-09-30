import { getLatestOpenExamAttempt, useAppSelector } from "@/core/store";
import { getBundledExam } from "../data/bundled-exams";
import { getDoneCount } from "../logic/attempt";
import { describeContinue } from "../logic/progress";

/**
 * The attempt the learner began most recently and hasn't finished, for the
 * exams page's way back into it — its ID, and what it is and how far through
 * — or null when there's none, or its exam isn't bundled any more.
 */
export function useContinueAttempt() {
  const attempt = useAppSelector(getLatestOpenExamAttempt);
  const parsed = attempt ? getBundledExam(attempt.examId) : null;
  if (!attempt || !parsed?.ok) return null;
  return {
    attemptId: attempt.id,
    ...describeContinue(
      { mode: attempt.mode, done: getDoneCount(attempt), total: attempt.items.length },
      parsed.exam.summary.title,
    ),
  };
}
