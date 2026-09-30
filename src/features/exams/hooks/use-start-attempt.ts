import type { ExamMode } from "@/types/domain";
import { useStoreActions } from "@/core/store";
import { toAttemptItems } from "../logic/attempt";
import type { Exam, ExamQuestion } from "../types";

/**
 * Starts an attempt at an exam in a mode — over all its questions, or just
 * some (a review's) — and hands back its ID for the caller to open.
 */
export function useStartAttempt() {
  const actions = useStoreActions();
  return (exam: Exam, mode: ExamMode, questions: readonly ExamQuestion[] = exam.questions) =>
    actions.startExamAttempt({
      examId: exam.summary.id,
      examVersion: exam.summary.version,
      mode,
      items: toAttemptItems(questions),
    });
}
