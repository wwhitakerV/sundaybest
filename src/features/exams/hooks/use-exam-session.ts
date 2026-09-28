import type { ExamAttempt, ExamResponse, Id } from "@/types/domain";

import { getExamItemResponse, useStoreActions } from "@/core/store";
import { checkAnswer, gradeAttempt } from "../data/exam-grading";

/**
 * An attempt's actions, wired to the store and the grading seam: record a
 * response, check a Study answer, finish. The store decides what's allowed;
 * grading happens only here, through the seam — never in a component.
 */
export function useExamSession(attempt: ExamAttempt | null) {
  const actions = useStoreActions();

  return {
    record(questionId: Id, response: ExamResponse) {
      if (attempt) actions.recordExamResponse(attempt.id, questionId, response);
    },
    /** Checks a Study answer against its key, and locks it. */
    check(questionId: Id) {
      const response = attempt ? getExamItemResponse(attempt, questionId)?.response : undefined;
      if (!attempt || !response) return;
      const correct = checkAnswer(attempt.examId, questionId, response);
      if (correct !== null) actions.checkExamResponse(attempt.id, questionId, correct);
    },
    /** Grades and finishes the attempt. False if it couldn't be graded. */
    finish(): boolean {
      const result = attempt ? gradeAttempt(attempt) : null;
      if (!attempt || !result) return false;
      actions.completeExamAttempt(attempt.id, result);
      return true;
    },
  };
}
