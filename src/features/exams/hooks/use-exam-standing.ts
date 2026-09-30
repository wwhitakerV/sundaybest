import {
  getExamConceptsForReview,
  getLatestCompletedExamAttempt,
  getOpenExamAttempt,
  hasRevealedExamAnswers,
  useAppSelector,
  type AppState,
} from "@/core/store";
import { getDoneCount } from "../logic/attempt";
import { describeExamStanding, type ExamHistory } from "../logic/standing";

/**
 * What the learner has done with an exam, read from the store: the history
 * its standing and actions are worked out from, and the attempts behind it.
 */
function readExamHistory(state: AppState, examId: string) {
  const openExam = getOpenExamAttempt(state, examId, "exam");
  const openStudy = getOpenExamAttempt(state, examId, "study");
  const latestExam = getLatestCompletedExamAttempt(state, examId, "exam");
  const result = latestExam?.result ?? null;
  const history: ExamHistory = {
    openExam: openExam && { answered: getDoneCount(openExam), total: openExam.items.length },
    openStudy: openStudy && { checked: getDoneCount(openStudy) },
    latestExam:
      latestExam && result
        ? {
            correct: result.correct,
            total: result.total,
            band: result.band,
            practice: latestExam.practice,
          }
        : null,
    revealed: hasRevealedExamAnswers(state, examId),
  };
  return { history, openExam, openStudy, latestExam };
}

/**
 * Where the learner stands with an exam (`describeExamStanding`) — how far
 * through an unfinished one, the last score, what Study has shown — the
 * history it's read from, for what beginning each mode does
 * (`describeBeginAction`), and the attempts behind it.
 */
export function useExamStanding(examId: string) {
  const read = useAppSelector((state) => readExamHistory(state, examId));
  return { ...read, standing: describeExamStanding(read.history) };
}

/** Where the learner stands with each of several exams, in order. */
export function useExamStandings(examIds: readonly string[]) {
  return useAppSelector((state) =>
    examIds.map((examId) => describeExamStanding(readExamHistory(state, examId).history)),
  );
}

/** How many concepts wait for review on each of several exams, in order. */
export function useExamReviewCounts(examIds: readonly string[]) {
  return useAppSelector((state) =>
    examIds.map((examId) => getExamConceptsForReview(state, examId).length),
  );
}
