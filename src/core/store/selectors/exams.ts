import type { ExamAttempt, ExamMode, Id } from "@/types/domain";

import { compareIso } from "../dates";
import { getMissedConcepts } from "../exam-responses";
import type { AppState } from "../state";
import { findById, listAll } from "../table";

function attemptsAt(state: AppState, examId: string): ExamAttempt[] {
  return listAll(state.examAttempts).filter((attempt) => attempt.examId === examId);
}

export function getExamAttempt(state: AppState, attemptId: Id): ExamAttempt | null {
  return findById(state.examAttempts, attemptId);
}

/**
 * The attempt at an exam still under way — in `mode`, when given — or null.
 * There's at most one per mode: an unfinished Study attempt never blocks an
 * Exam one, or the reverse.
 */
export function getOpenExamAttempt(
  state: AppState,
  examId: string,
  mode?: ExamMode,
): ExamAttempt | null {
  return (
    attemptsAt(state, examId)
      .filter((attempt) => attempt.status === "inProgress")
      .filter((attempt) => mode === undefined || attempt.mode === mode)
      .sort((a, b) => compareIso(b.startedAt, a.startedAt))
      .at(0) ?? null
  );
}

/** The attempt at an exam finished most recently, or null. */
export function getLatestCompletedExamAttempt(state: AppState, examId: string): ExamAttempt | null {
  return (
    attemptsAt(state, examId)
      .filter((attempt) => attempt.status === "completed")
      .sort((a, b) => compareIso(b.completedAt ?? "", a.completedAt ?? ""))
      .at(0) ?? null
  );
}

/**
 * Whether an exam's answers have already been shown: a finished Exam
 * attempt, or a Study attempt with at least one checked answer. Only
 * opening Study Mode reveals nothing. After this, an Exam attempt is
 * Practice.
 */
export function hasRevealedExamAnswers(state: AppState, examId: string): boolean {
  return attemptsAt(state, examId).some((attempt) =>
    attempt.mode === "exam"
      ? attempt.status === "completed"
      : attempt.responses.some((entry) => entry.check !== null),
  );
}

/**
 * The primary concepts to review for an exam: each one missed in its latest
 * finished attempt, whatever its label, once, in question order.
 */
export function getExamConceptsForReview(state: AppState, examId: string): string[] {
  const latest = getLatestCompletedExamAttempt(state, examId);
  return latest ? getMissedConcepts(latest) : [];
}
