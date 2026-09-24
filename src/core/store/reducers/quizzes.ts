import type { Id, QuizAttempt } from "@/types/domain";

import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { findById, listAll, withRecord } from "../table";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

function questionsOf(state: AppState, quizId: Id) {
  return listAll(state.quizQuestions)
    .filter((question) => question.quizId === quizId)
    .sort((a, b) => a.order - b.order);
}

function isAnswered(state: AppState, attemptId: Id, questionId: Id): boolean {
  return listAll(state.quizAnswers).some(
    (answer) => answer.attemptId === attemptId && answer.questionId === questionId,
  );
}

/** An attempt that's under way, or null. */
function openAttempt(state: AppState, attemptId: Id): QuizAttempt | null {
  const attempt = findById(state.quizAttempts, attemptId);
  return attempt?.status === "inProgress" ? attempt : null;
}

function withAttempt(state: AppState, attempt: QuizAttempt): AppState {
  return { ...state, quizAttempts: withRecord(state.quizAttempts, attempt) };
}

/**
 * A new go at a quiz, on its first question. Not while another attempt at it
 * is under way, and not for a plan that isn't built or has been put away.
 */
export function startQuizAttempt(state: AppState, action: Action<"quiz/startAttempt">): AppState {
  const quiz = findById(state.quizzes, action.quizId);
  const plan = quiz ? findById(state.plans, quiz.planId) : null;
  const first = quiz ? questionsOf(state, quiz.id).at(0) : undefined;
  if (!quiz || !plan || !first || findById(state.quizAttempts, action.attemptId)) return state;
  if (!["ready", "active", "completed"].includes(plan.status)) return state;
  const alreadyOpen = listAll(state.quizAttempts).some(
    (attempt) => attempt.quizId === quiz.id && attempt.status === "inProgress",
  );
  if (alreadyOpen) return state;
  return withAttempt(state, {
    id: action.attemptId,
    createdAt: action.at,
    updatedAt: action.at,
    quizId: quiz.id,
    status: "inProgress",
    currentQuestionId: first.id,
    selectedChoiceId: null,
    startedAt: action.at,
    completedAt: null,
  });
}

/** A choice picked for the question on screen — one of its own, before it's submitted. */
export function selectQuizAnswer(state: AppState, action: Action<"quiz/selectAnswer">): AppState {
  const attempt = openAttempt(state, action.attemptId);
  const question = attempt?.currentQuestionId
    ? findById(state.quizQuestions, attempt.currentQuestionId)
    : null;
  if (!attempt || !question || isAnswered(state, attempt.id, question.id)) return state;
  const isChoice = question.choices.some((choice) => choice.id === action.choiceId);
  if (!isChoice || attempt.selectedChoiceId === action.choiceId) return state;
  return withAttempt(state, {
    ...attempt,
    selectedChoiceId: action.choiceId,
    updatedAt: action.at,
  });
}

/** The picked choice, submitted as the question's answer — once per question. */
export function submitQuizAnswer(state: AppState, action: Action<"quiz/submitAnswer">): AppState {
  const attempt = openAttempt(state, action.attemptId);
  const questionId = attempt?.currentQuestionId;
  const choiceId = attempt?.selectedChoiceId;
  if (!attempt || !questionId || !choiceId || findById(state.quizAnswers, action.answerId)) {
    return state;
  }
  if (isAnswered(state, attempt.id, questionId)) return state;
  return {
    ...withAttempt(state, { ...attempt, selectedChoiceId: null, updatedAt: action.at }),
    quizAnswers: withRecord(state.quizAnswers, {
      id: action.answerId,
      createdAt: action.at,
      updatedAt: action.at,
      attemptId: attempt.id,
      questionId,
      choiceId,
      answeredAt: action.at,
    }),
  };
}

/** On to the next question — once the current one is answered, and if there is one. */
export function moveToNextQuestion(state: AppState, action: Action<"quiz/nextQuestion">): AppState {
  const attempt = openAttempt(state, action.attemptId);
  const current = attempt?.currentQuestionId;
  if (!attempt || !current || !isAnswered(state, attempt.id, current)) return state;
  const questions = questionsOf(state, attempt.quizId);
  const next = questions.at(questions.findIndex((question) => question.id === current) + 1);
  if (!next || next.id === current) return state;
  return withAttempt(state, {
    ...attempt,
    currentQuestionId: next.id,
    selectedChoiceId: null,
    updatedAt: action.at,
  });
}

/**
 * An attempt finished — only one under way, with every question answered,
 * and only once. That's its completion record; its score is worked out from
 * its answers.
 */
export function completeQuizAttempt(
  state: AppState,
  action: Action<"quiz/completeAttempt" | "progress/recordQuizCompletion">,
): AppState {
  const attempt = openAttempt(state, action.attemptId);
  if (!attempt) return state;
  const allAnswered = questionsOf(state, attempt.quizId).every((question) =>
    isAnswered(state, attempt.id, question.id),
  );
  if (!allAnswered) return state;
  return withAttempt(state, {
    ...attempt,
    status: "completed",
    currentQuestionId: null,
    selectedChoiceId: null,
    completedAt: action.at,
    updatedAt: action.at,
  });
}
