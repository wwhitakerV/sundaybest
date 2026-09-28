import type { Entity, Id, IsoDateTime } from "./common";

/**
 * - `exam` — answers saved silently, scored only once submitted.
 * - `study` — each answer checked as it's given, with its teaching; never scored.
 */
export type ExamMode = "exam" | "study";

/** How a question is answered: the exam content's `interaction.kind`. */
export type ExamInteractionKind =
  "single_choice" | "true_false" | "multiple_select" | "matching" | "ordering";

/** One prompt paired with one target, in a matching response. */
export type ExamPair = { promptId: Id; targetId: Id };

/**
 * An answer to one question, as IDs only — never display positions. A
 * response can be partial (some prompts paired, some steps placed); whether
 * it's complete is worked out against the question (`isExamResponseComplete`).
 */
export type ExamResponse =
  | { kind: "single_choice" | "true_false"; choiceId: Id }
  | { kind: "multiple_select"; choiceIds: Id[] }
  | { kind: "matching"; pairs: ExamPair[] }
  | { kind: "ordering"; stepIds: Id[] };

/**
 * A question as an attempt took it: its ID and version, the concept it
 * observes, and the IDs a response to it may use. Enough to check and score
 * the attempt later, whatever becomes of the content — never its answer key.
 */
export type ExamAttemptItem = {
  questionId: Id;
  version: number;
  primaryConceptId: string;
} & (
  | { kind: "single_choice" | "true_false" | "multiple_select"; choiceIds: Id[] }
  | { kind: "matching"; promptIds: Id[]; targetIds: Id[] }
  | { kind: "ordering"; stepIds: Id[] }
);

/** A Study Mode answer, checked: when, and whether it was right. */
export type ExamCheck = { at: IsoDateTime; correct: boolean };

/** The latest response to one question in an attempt. */
export type ExamItemResponse = {
  questionId: Id;
  response: ExamResponse;
  respondedAt: IsoDateTime;
  /** Study Mode only: set once, when it's checked. Locks the response. */
  check: ExamCheck | null;
};

/** A concept's evidence label. */
export type ExamConceptLabel = "strength" | "needsReview" | "notEnoughEvidence";

/** How one primary concept went in an attempt. */
export type ExamConceptResult = {
  conceptId: string;
  correct: number;
  total: number;
  label: ExamConceptLabel;
};

/** How one question went. Unanswered or incomplete counts as incorrect. */
export type ExamItemResult = { questionId: Id; correct: boolean; answered: boolean };

/**
 * A finished attempt's graded result, recorded when it finished — so a later
 * edit to the content never changes it.
 */
export type ExamResult = {
  correct: number;
  total: number;
  /** Right answers out of all questions, 0–100, rounded. */
  percentage: number;
  /** The score band's label; null for a Study attempt, which isn't scored. */
  band: string | null;
  items: ExamItemResult[];
  concepts: ExamConceptResult[];
};

/** - `inProgress` — under way. - `completed` — submitted (Exam) or finished (Study). */
export type ExamAttemptStatus = "inProgress" | "completed";

/**
 * One go at an exam. A snapshot: the exam's ID and version and every
 * question's ID and version are fixed when it starts, and its result when it
 * finishes. Its responses live inside it — they belong to no other record.
 */
export type ExamAttempt = Entity & {
  examId: string;
  examVersion: number;
  mode: ExamMode;
  /**
   * Started after answers to this exam had been revealed (a finished Exam
   * attempt, or a Study attempt with a checked answer): scored as usual, but
   * never evidence for a concept.
   */
  practice: boolean;
  items: ExamAttemptItem[];
  responses: ExamItemResponse[];
  status: ExamAttemptStatus;
  startedAt: IsoDateTime;
  completedAt: IsoDateTime | null;
  result: ExamResult | null;
};
