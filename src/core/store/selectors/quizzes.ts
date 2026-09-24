import type { Id, Quiz, QuizAnswer, QuizAttempt, QuizQuestion } from "@/types/domain";

import { compareIso } from "../dates";
import type { AppState } from "../state";
import { findById, listAll } from "../table";

/** The Quick Check that follows a day, if it has one. */
export function getQuizForDay(state: AppState, dayId: Id): Quiz | null {
  return listAll(state.quizzes).find((quiz) => quiz.planDayId === dayId) ?? null;
}

export function getQuizzesForPlan(state: AppState, planId: Id): Quiz[] {
  return listAll(state.quizzes).filter((quiz) => quiz.planId === planId);
}

/** A quiz's questions, in order. */
export function getQuizQuestions(state: AppState, quizId: Id): QuizQuestion[] {
  return listAll(state.quizQuestions)
    .filter((question) => question.quizId === quizId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Where a quiz stands: `notStarted` (no attempt yet), `inProgress`, or
 * `completed` — by its latest attempt.
 */
export type QuizStatus = "notStarted" | "inProgress" | "completed";

export function getQuizStatus(state: AppState, quizId: Id): QuizStatus {
  return getQuizAttempt(state, quizId)?.status ?? "notStarted";
}

/** The latest attempt at a quiz, or null if it hasn't been taken. */
export function getQuizAttempt(state: AppState, quizId: Id): QuizAttempt | null {
  return (
    listAll(state.quizAttempts)
      .filter((attempt) => attempt.quizId === quizId)
      .sort((a, b) => compareIso(b.startedAt, a.startedAt))
      .at(0) ?? null
  );
}

/**
 * An attempt's answers, one per question — its first, should a stray record
 * ever give a question two (submitting refuses a second, but a score must
 * never be inflated by one) — in the order they were given.
 */
export function getAttemptAnswers(state: AppState, attemptId: Id): QuizAnswer[] {
  const answers = listAll(state.quizAnswers)
    .filter((answer) => answer.attemptId === attemptId)
    .sort((a, b) => compareIso(a.answeredAt, b.answeredAt));
  return answers.filter(
    (answer, index) =>
      answers.findIndex((other) => other.questionId === answer.questionId) === index,
  );
}

export function isAnswerCorrect(state: AppState, answer: QuizAnswer): boolean {
  return findById(state.quizQuestions, answer.questionId)?.correctChoiceId === answer.choiceId;
}

/** How one question went in an attempt. */
export type QuestionResult = "unanswered" | "correct" | "incorrect";

export function getQuestionResult(state: AppState, attemptId: Id, questionId: Id): QuestionResult {
  const answer = getAttemptAnswers(state, attemptId).find(
    (candidate) => candidate.questionId === questionId,
  );
  if (!answer) return "unanswered";
  return isAnswerCorrect(state, answer) ? "correct" : "incorrect";
}

/** An attempt's score so far, out of every question in its quiz. */
export type QuizScore = {
  correct: number;
  answered: number;
  total: number;
  /** Right answers out of all questions, 0–100, rounded. */
  percentage: number;
};

export function getQuizScore(state: AppState, attemptId: Id): QuizScore | null {
  const attempt = findById(state.quizAttempts, attemptId);
  if (!attempt) return null;
  const answers = getAttemptAnswers(state, attemptId);
  const correct = answers.filter((answer) => isAnswerCorrect(state, answer)).length;
  const total = getQuizQuestions(state, attempt.quizId).length;
  return {
    correct,
    answered: answers.length,
    total,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}
