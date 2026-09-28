import type {
  ExamAttempt,
  ExamItemResponse,
  ExamPair,
  ExamResponse,
  ExamResult,
  Id,
} from "@/types/domain";

import type { AppAction } from "@/core/store";

import { defineFactory } from "./build";

/**
 * Builders for theology exam attempts: one attempt item per interaction kind,
 * responses that answer them, a full graded result, an attempt (and one of
 * its item responses) to hand a pure helper directly, and the four store
 * actions that drive an attempt through the reducer. Tests state only what
 * they care about; everything else comes from here instead of inline
 * literals.
 */

const AT = "2026-09-28T09:00:00.000Z";
const EXAM_ID = "exam-theo-01-01";

// --- Attempt items, one per interaction kind --------------------------------

type SingleChoiceAttemptItem = {
  questionId: Id;
  version: number;
  primaryConceptId: string;
  kind: "single_choice";
  choiceIds: Id[];
};

type TrueFalseAttemptItem = {
  questionId: Id;
  version: number;
  primaryConceptId: string;
  kind: "true_false";
  choiceIds: Id[];
};

type MultipleSelectAttemptItem = {
  questionId: Id;
  version: number;
  primaryConceptId: string;
  kind: "multiple_select";
  choiceIds: Id[];
};

type MatchingAttemptItem = {
  questionId: Id;
  version: number;
  primaryConceptId: string;
  kind: "matching";
  promptIds: Id[];
  targetIds: Id[];
};

type OrderingAttemptItem = {
  questionId: Id;
  version: number;
  primaryConceptId: string;
  kind: "ordering";
  stepIds: Id[];
};

/** A single_choice item, choices A–D. */
export const aSingleChoiceItem = defineFactory<SingleChoiceAttemptItem>(() => ({
  questionId: "q-single-choice",
  version: 1,
  primaryConceptId: "concept-canon",
  kind: "single_choice",
  choiceIds: ["A", "B", "C", "D"],
}));

/** A true_false item, choices T/F. */
export const aTrueFalseItem = defineFactory<TrueFalseAttemptItem>(() => ({
  questionId: "q-true-false",
  version: 1,
  primaryConceptId: "concept-canon",
  kind: "true_false",
  choiceIds: ["T", "F"],
}));

/** A multiple_select item, choices A–D. */
export const aMultipleSelectItem = defineFactory<MultipleSelectAttemptItem>(() => ({
  questionId: "q-multiple-select",
  version: 1,
  primaryConceptId: "concept-canon",
  kind: "multiple_select",
  choiceIds: ["A", "B", "C", "D"],
}));

/** A matching item: prompts P1–P3, targets R1–R3. */
export const aMatchingItem = defineFactory<MatchingAttemptItem>(() => ({
  questionId: "q-matching",
  version: 1,
  primaryConceptId: "concept-canon",
  kind: "matching",
  promptIds: ["P1", "P2", "P3"],
  targetIds: ["R1", "R2", "R3"],
}));

/** An ordering item: steps S1–S4. */
export const anOrderingItem = defineFactory<OrderingAttemptItem>(() => ({
  questionId: "q-ordering",
  version: 1,
  primaryConceptId: "concept-canon",
  kind: "ordering",
  stepIds: ["S1", "S2", "S3", "S4"],
}));

// --- Responses, one per interaction kind -------------------------------------

export function singleChoiceResponse(choiceId: Id = "A"): ExamResponse {
  return { kind: "single_choice", choiceId };
}

export function trueFalseResponse(choiceId: Id = "T"): ExamResponse {
  return { kind: "true_false", choiceId };
}

export function multipleSelectResponse(choiceIds: Id[] = ["A", "B"]): ExamResponse {
  return { kind: "multiple_select", choiceIds };
}

export function matchingResponse(
  pairs: ExamPair[] = [{ promptId: "P1", targetId: "R1" }],
): ExamResponse {
  return { kind: "matching", pairs };
}

export function orderingResponse(stepIds: Id[] = ["S1", "S2", "S3", "S4"]): ExamResponse {
  return { kind: "ordering", stepIds };
}

// --- A full graded result ----------------------------------------------------

export const anExamResult = defineFactory<ExamResult>(() => ({
  correct: 4,
  total: 5,
  percentage: 80,
  band: "Well done",
  items: [
    { questionId: "q-single-choice", correct: true, answered: true },
    { questionId: "q-true-false", correct: true, answered: true },
    { questionId: "q-multiple-select", correct: true, answered: true },
    { questionId: "q-matching", correct: true, answered: true },
    { questionId: "q-ordering", correct: false, answered: true },
  ],
  concepts: [{ conceptId: "concept-canon", correct: 4, total: 5, label: "strength" }],
}));

// --- An attempt and one of its item responses, for the pure helpers ---------

/** A full attempt, in progress, one item of each kind, unanswered. For the pure helpers in `exam-responses.ts`. */
export const anExamAttempt = defineFactory<ExamAttempt>(() => ({
  id: "attempt-exam-1",
  createdAt: AT,
  updatedAt: AT,
  examId: EXAM_ID,
  examVersion: 4,
  mode: "exam",
  practice: false,
  items: [
    aSingleChoiceItem(),
    aTrueFalseItem(),
    aMultipleSelectItem(),
    aMatchingItem(),
    anOrderingItem(),
  ],
  responses: [],
  status: "inProgress",
  startedAt: AT,
  completedAt: null,
  result: null,
}));

export const anExamItemResponse = defineFactory<ExamItemResponse>(() => ({
  questionId: "q-single-choice",
  response: singleChoiceResponse(),
  respondedAt: AT,
  check: null,
}));

// --- Store actions -----------------------------------------------------------

type ExamStartAttemptAction = Extract<AppAction, { type: "exam/startAttempt" }>;
type ExamRecordResponseAction = Extract<AppAction, { type: "exam/recordResponse" }>;
type ExamCheckResponseAction = Extract<AppAction, { type: "exam/checkResponse" }>;
type ExamCompleteAttemptAction = Extract<AppAction, { type: "exam/completeAttempt" }>;

export const startAttemptAction = defineFactory<ExamStartAttemptAction>(() => ({
  type: "exam/startAttempt",
  attemptId: "attempt-exam-1",
  examId: EXAM_ID,
  examVersion: 4,
  mode: "exam",
  items: [
    aSingleChoiceItem(),
    aTrueFalseItem(),
    aMultipleSelectItem(),
    aMatchingItem(),
    anOrderingItem(),
  ],
  at: AT,
}));

export const recordResponseAction = defineFactory<ExamRecordResponseAction>(() => ({
  type: "exam/recordResponse",
  attemptId: "attempt-exam-1",
  questionId: "q-single-choice",
  response: singleChoiceResponse(),
  at: AT,
}));

export const checkResponseAction = defineFactory<ExamCheckResponseAction>(() => ({
  type: "exam/checkResponse",
  attemptId: "attempt-exam-1",
  questionId: "q-single-choice",
  correct: true,
  at: AT,
}));

export const completeAttemptAction = defineFactory<ExamCompleteAttemptAction>(() => ({
  type: "exam/completeAttempt",
  attemptId: "attempt-exam-1",
  result: anExamResult(),
  at: AT,
}));
