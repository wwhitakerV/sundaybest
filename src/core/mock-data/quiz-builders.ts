import type {
  Id,
  Plan,
  PlanDay,
  Quiz,
  QuizAnswer,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionKind,
  QuizQuestionSource,
} from "@/types/domain";

import { makeChoices } from "./quiz-choices";

type Letter = "a" | "b" | "c" | "d";

/** One question, as written: its four choices, which is right, and why. */
export type WrittenQuestion = {
  kind: QuizQuestionKind;
  source: QuizQuestionSource;
  prompt: string;
  choices: readonly [string, string, string, string];
  correct: Letter;
  explanation: string;
  scriptureReference: string | null;
};

/** A day's Quick Check and its questions, in order. */
export function makeDayQuiz(
  plan: Plan,
  day: PlanDay | undefined,
  builtAt: string,
  written: readonly WrittenQuestion[],
): { quiz: Quiz; questions: QuizQuestion[] } {
  const dayNumber = day?.dayNumber ?? 0;
  const quiz: Quiz = {
    id: `${plan.id}-day-${dayNumber}-quiz`,
    createdAt: builtAt,
    updatedAt: builtAt,
    planId: plan.id,
    planDayId: day?.id ?? null,
    title: `Day ${dayNumber} quick check`,
  };
  const questions = written.map((question, index): QuizQuestion => {
    const id = `${quiz.id}-q${index + 1}`;
    return {
      id,
      createdAt: builtAt,
      updatedAt: builtAt,
      quizId: quiz.id,
      order: index + 1,
      kind: question.kind,
      source: question.source,
      prompt: question.prompt,
      choices: makeChoices(id, question.choices),
      correctChoiceId: `${id}-${question.correct}`,
      explanation: question.explanation,
      scriptureReference: question.scriptureReference,
    };
  });
  return { quiz, questions };
}

/** A minute after `start`, `minutes` on — the attempt's clock. */
function after(start: string, minutes: number): string {
  return new Date(new Date(start).getTime() + minutes * 60_000).toISOString();
}

/**
 * An attempt at a quiz: `picks` are the letters chosen, question by question,
 * a minute apart from `start`. Every question picked is a finished attempt;
 * fewer is one under way, on the next question, with `pending` picked but
 * not yet submitted.
 */
export function makeAttempt(
  quiz: Quiz,
  questions: readonly QuizQuestion[],
  start: string,
  picks: readonly Letter[],
  pending: Letter | null = null,
): { attempt: QuizAttempt; answers: QuizAnswer[] } {
  const finished = picks.length === questions.length;
  const onQuestion: Id | null = finished ? null : (questions.at(picks.length)?.id ?? null);
  const last = after(start, picks.length);
  const attempt: QuizAttempt = {
    id: `${quiz.id}-attempt-1`,
    createdAt: start,
    updatedAt: last,
    quizId: quiz.id,
    status: finished ? "completed" : "inProgress",
    currentQuestionId: onQuestion,
    selectedChoiceId: onQuestion && pending ? `${onQuestion}-${pending}` : null,
    startedAt: start,
    completedAt: finished ? last : null,
  };
  const answers = picks.map((letter, index): QuizAnswer => {
    const question = questions.at(index);
    const answeredAt = after(start, index + 1);
    return {
      id: `${attempt.id}-q${index + 1}`,
      createdAt: answeredAt,
      updatedAt: answeredAt,
      attemptId: attempt.id,
      questionId: question?.id ?? "",
      choiceId: `${question?.id ?? ""}-${letter}`,
      answeredAt,
    };
  });
  return { attempt, answers };
}
