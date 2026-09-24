import type { Entity, Id, IsoDateTime } from "./common";

/** A plan's Quick Check: a few questions on the sermon and its Scripture. */
export type Quiz = Entity & {
  planId: Id;
  /** The day it follows, or null for one that covers the whole plan. */
  planDayId: Id | null;
  title: string;
};

/**
 * - `multipleChoice` — pick one of several answers.
 * - `finishTheVerse` — pick the words that complete a verse.
 */
export type QuizQuestionKind = "multipleChoice" | "finishTheVerse";

/** What a question draws on: the sermon itself, or the Scripture. */
export type QuizQuestionSource = "sermon" | "scripture";

/** One answer a question offers ("A. Build an altar at Shechem"). */
export type QuizChoice = {
  id: Id;
  /** Its letter: "A", "B", … */
  label: string;
  text: string;
};

export type QuizQuestion = Entity & {
  quizId: Id;
  /** Its place in the quiz, from 1 ("1 of 3"). */
  order: number;
  kind: QuizQuestionKind;
  source: QuizQuestionSource;
  prompt: string;
  choices: QuizChoice[];
  correctChoiceId: Id;
  /** Shown once answered, to say why. */
  explanation: string | null;
  /** The passage it draws on, when it has one: `"Joshua 24:15"`. */
  scriptureReference: string | null;
};

/** - `inProgress` — started, not every question answered. - `completed` — done. */
export type QuizAttemptStatus = "inProgress" | "completed";

/** One go at a quiz. */
export type QuizAttempt = Entity & {
  quizId: Id;
  status: QuizAttemptStatus;
  startedAt: IsoDateTime;
  completedAt: IsoDateTime | null;
};

/**
 * The choice the user picked for one question, in one attempt. Whether it's
 * right is worked out against the question's `correctChoiceId`.
 */
export type QuizAnswer = Entity & {
  attemptId: Id;
  questionId: Id;
  choiceId: Id;
  answeredAt: IsoDateTime;
};
