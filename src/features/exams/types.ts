/** Types owned by this slice. Anything another slice needs must be re-exported from `index.ts`. */
import type { ExamInteractionKind, ExamPair, Id } from "@/types/domain";

/** A passage and where to read it: `exam.sourceScope.scriptureLinks[]`, `questions[].sources[]`. */
export type PassageLink = { reference: string; url: string };

/** The mark drawn beside a thing explored: a passage of Scripture, people, or a letter. */
export type ExploreIcon = "scripture" | "people" | "letter";

/** One thing an exam explores, and the passage it's in. */
export type ExploreItem = { title: string; icon: ExploreIcon; passage: PassageLink };

/** The four levels, each going deeper into the texts — never a rank. */
export type ExamLevel = "foundations" | "intermediate" | "advanced" | "scholar";

/** An exam as the exams page lists it: its level and title, and the ID its overview opens by. */
type CatalogExam = { examId: string; level: ExamLevel; title: string };

/** A subject of study, its exams from Foundations to Scholar. */
export type Subject = { id: string; title: string; exams: CatalogExam[] };

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
  /** The question it opens with (`exam.experience.overview.question`), if the content sets one. */
  question: string | null;
  questionCount: number;
  /** Shortest and longest, in minutes. */
  durationMinutes: readonly [number, number];
  /** What the exam has the learner able to do (`exam.objectives`) — its syllabus. */
  objectives: string[];
  /** What the learner will explore, each in one passage (`exam.experience.overview.explore`). */
  explore: ExploreItem[];
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
