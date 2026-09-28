/** Types owned by this slice. Anything another slice needs must be re-exported from `index.ts`. */
import type { ExamInteractionKind, ExamPair, Id } from "@/types/domain";

/** A passage and where to read it: `exam.sourceScope.scriptureLinks[]`, `questions[].sources[]`. */
export type PassageLink = { reference: string; url: string };

/** A labelled thing a response points at by ID: a choice, prompt, target, or step. */
export type ExamOption = { id: Id; label: string };

/** A score band, from `exam.experience.results.bands`. */
export type ExamBand = { minPercent: number; label: string };

/** What the overview shows: the exam, without its questions. */
type ExamSummary = {
  id: string;
  version: number;
  domain: string;
  level: string;
  title: string;
  overview: string;
  questionCount: number;
  /** Shortest and longest, in minutes. */
  durationMinutes: readonly [number, number];
  objectives: string[];
  concepts: string[];
  /** Each mode's description, from `exam.completionBehavior`. */
  modeDescriptions: { exam: string; study: string };
  sourceLinks: PassageLink[];
};

/** The rules the exam carries for its experience (`exam.experience`). */
export type ExamRules = {
  bands: ExamBand[];
  /** `results.conceptLabelMinimumIndependentObservations`. */
  conceptMinimumObservations: number;
  /** `teaching.actionLabel` — "Understand why". */
  actionLabel: string;
};

/**
 * A question as the question screen sees it — never its answer key,
 * rationales, `whyCorrect`, or teaching. Those wait in a `QuestionReveal`.
 */
export type ExamQuestion = {
  id: Id;
  version: number;
  /** Its place in the exam, from 1. */
  number: number;
  primaryConceptId: string;
  stem: string;
  passages: PassageLink[];
} & (
  | { kind: "single_choice" | "true_false" | "multiple_select"; choices: ExamOption[] }
  | { kind: "matching"; prompts: ExamOption[]; targets: ExamOption[] }
  | { kind: "ordering"; steps: ExamOption[] }
);

/** A question's answer key, by kind. */
export type ExamAnswerKey =
  | { kind: "single_choice" | "true_false"; choiceId: Id }
  | { kind: "multiple_select"; choiceIds: Id[] }
  | { kind: "matching"; pairs: ExamPair[] }
  | { kind: "ordering"; stepIds: Id[] };

/** A line of feedback attached to one option: a choice's rationale, a prompt's or step's feedback. */
export type OptionFeedback = { optionId: Id; text: string };

/** A question's teaching, for Understand why. */
type ExamTeaching = {
  title: string;
  concept: string;
  grounding: PassageLink[];
  importantDistinction: string;
  rememberThis: string;
};

/** Everything about a question that waits until its answer is revealed. */
export type QuestionReveal = {
  questionId: Id;
  kind: ExamInteractionKind;
  key: ExamAnswerKey;
  whyCorrect: string;
  /** Choice kinds: every choice's rationale. Matching: `matchFeedback`. Ordering: `stepFeedback`. */
  feedback: OptionFeedback[];
  teaching: ExamTeaching;
};

/** A loaded exam: what the screens may show before any reveal. */
export type Exam = {
  summary: ExamSummary;
  rules: ExamRules;
  questions: ExamQuestion[];
};
