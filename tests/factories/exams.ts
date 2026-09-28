/**
 * Fixtures for the Theology Exams slice.
 *
 * `theologyExamContent()` returns a deep clone of the real bundled content
 * (`SundayBest THEO-01-01 v2` — schema v2), typed loosely enough that a test
 * can mutate it into a broken variant (delete a required field, rename a
 * kind, duplicate an id) without fighting the type checker. Its shape is
 * hand-authored, not inferred from the JSON import, precisely so those
 * fields are wide (`string`, optional, `unknown`) rather than the narrow
 * literal types `tsc` would otherwise infer from a JSON literal.
 *
 * `aTheologyExamAttempt()` builds an in-progress `ExamAttempt` whose items
 * come from that same real content, so grading and result-building tests
 * exercise the exam's actual questions rather than an invented shape.
 */
import type { ExamAttempt, ExamAttemptItem, IsoDateTime } from "@/types/domain";

import rawContent from "@/features/exams/data/content/THEO-01-01.json";

export type TheologyExamChoice = { id: string; label: string; rationale?: string };
export type TheologyExamPromptOrTarget = { id: string; label: string };
export type TheologyExamStep = { id: string; label: string };

export type TheologyExamSource = {
  kind: string;
  reference: string;
  translation: string;
  url: string;
  supports: string;
};

export type TheologyExamInteraction = {
  kind: string;
  choices?: TheologyExamChoice[];
  prompts?: TheologyExamPromptOrTarget[];
  targets?: TheologyExamPromptOrTarget[];
  steps?: TheologyExamStep[];
  /** Shape varies by `kind` (a choice id, an array, or a prompt→target map) — loose on purpose. */
  answerKey: unknown;
  scoring: string;
};

export type TheologyExamTeaching = {
  title: string;
  concept: string;
  biblicalGrounding: string[];
  importantDistinction: string;
  rememberThis?: string;
  reviewConceptIds: string[];
  matchFeedback?: Record<string, string>;
  stepFeedback?: Record<string, string>;
};

export type TheologyExamQuestion = {
  id: string;
  version: number;
  examId: string;
  primaryConceptId: string;
  secondaryConceptIds: string[];
  level: string;
  reasoningSkill: string;
  claimClass: string;
  stem: string;
  passageRefs: string[];
  whyCorrect?: string;
  teaching: TheologyExamTeaching;
  sources: TheologyExamSource[];
  interaction: TheologyExamInteraction;
};

export type TheologyExamBand = { minPercent: number; label: string };

export type TheologyExamContent = {
  schemaVersion: number;
  translation: string;
  exam: {
    id: string;
    version: number;
    domainId: string;
    domain: string;
    level: string;
    title: string;
    scope: string;
    overview: string;
    questionCount: number;
    durationMinutes: number[];
    objectives: string[];
    concepts: string[];
    prerequisites: string[];
    traditionScope: string;
    contestedBoundary: string;
    completionBehavior: { examMode: string; studyMode: string; results: string };
    sourceScope: {
      scripture: string[];
      historicalPrimary: string[];
      scriptureLinks: { reference: string; url: string }[];
    };
    questionIds: string[];
    interactionAllocation: Record<string, number>;
    experience: {
      modes: Record<string, unknown>;
      grading: Record<string, unknown>;
      teaching: { actionLabel: string } & Record<string, unknown>;
      results: {
        bands: TheologyExamBand[];
        conceptLabelMinimumIndependentObservations: number;
        showRawScore: boolean;
        showItemReview: boolean;
        queueMissedPrimaryConcepts: boolean;
      };
      retakes: Record<string, unknown>;
      accessibility: Record<string, unknown>;
    };
  };
  questions: TheologyExamQuestion[];
};

/** A deep clone of the real bundled THEO-01-01 content, safe for a test to mutate. */
export function theologyExamContent(): TheologyExamContent {
  return structuredClone(rawContent);
}

const FIXTURE_TIMESTAMP: IsoDateTime = "2026-09-28T09:00:00.000Z";

function itemFromQuestion(question: TheologyExamQuestion): ExamAttemptItem {
  const { id: questionId, version, primaryConceptId, interaction } = question;

  switch (interaction.kind) {
    case "matching":
      return {
        questionId,
        version,
        primaryConceptId,
        kind: "matching",
        promptIds: (interaction.prompts ?? []).map((prompt) => prompt.id),
        targetIds: (interaction.targets ?? []).map((target) => target.id),
      };
    case "ordering":
      return {
        questionId,
        version,
        primaryConceptId,
        kind: "ordering",
        stepIds: (interaction.steps ?? []).map((step) => step.id),
      };
    case "single_choice":
    case "true_false":
    case "multiple_select":
      return {
        questionId,
        version,
        primaryConceptId,
        kind: interaction.kind,
        choiceIds: (interaction.choices ?? []).map((choice) => choice.id),
      };
    default:
      throw new Error(
        `anExamAttempt: fixture question has an unknown interaction kind "${interaction.kind}"`,
      );
  }
}

/**
 * An in-progress Exam Mode attempt at the real content, with no responses
 * yet. `items` mirror the real exam's questions and their id universes
 * (choice/prompt/target/step ids) — never an answer key. A test that needs
 * responses adds them via `overrides.responses`, and a test that needs a
 * different mode, status, or practice flag overrides those fields directly.
 *
 * Named `aTheologyExamAttempt`, not `anExamAttempt`, because
 * `tests/factories/exam-attempts.ts` already exports a differently-shaped
 * `anExamAttempt` (one synthetic item per interaction kind, for the store
 * reducer's own tests) — same name, different fixture, would collide.
 */
export function aTheologyExamAttempt(overrides: Partial<ExamAttempt> = {}): ExamAttempt {
  const content = theologyExamContent();
  const items = content.questions.map(itemFromQuestion);

  return {
    id: "exam-attempt-1",
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
    examId: content.exam.id,
    examVersion: content.exam.version,
    mode: "exam",
    practice: false,
    items,
    responses: [],
    status: "inProgress",
    startedAt: FIXTURE_TIMESTAMP,
    completedAt: null,
    result: null,
    ...overrides,
  };
}
