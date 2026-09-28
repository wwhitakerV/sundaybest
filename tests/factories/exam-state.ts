/**
 * Fixtures built on the real THEO-01-01 content, for tests of the exam UI.
 *
 * `theologyExamContent()` (tests/factories/exams.ts) hands back a deep clone
 * of the bundled JSON; everything here turns that into the shapes the exam
 * screens and the store actually work with — attempt items, answer-key
 * responses, and seeded store state — so a screen test states only what it
 * cares about (which question was missed, which mode) rather than rebuilding
 * a 15-question exam by hand.
 */
import { appReducer, type AppState } from "@/core/store";
import { parseExamContent } from "@/features/exams/data/parse-exam";
import type { Exam, QuestionReveal } from "@/features/exams/types";
import type {
  ExamAttemptItem,
  ExamCheck,
  ExamConceptLabel,
  ExamConceptResult,
  ExamItemResult,
  ExamMode,
  ExamResponse,
  ExamResult,
  Id,
} from "@/types/domain";

import { theologyExamContent } from "./exams";

let cached: { exam: Exam; reveals: QuestionReveal[] } | null = null;

/** The real THEO-01-01 exam, parsed once. Throws loudly if the fixture itself won't parse. */
export function theologyExam(): { exam: Exam; reveals: QuestionReveal[] } {
  if (!cached) {
    const parsed = parseExamContent(theologyExamContent());
    if (!parsed.ok) {
      throw new Error(
        `THEO-01-01 fixture failed to parse: ${parsed.issues.join(", ")}. Fix the fixture, not the test.`,
      );
    }
    cached = { exam: parsed.exam, reveals: parsed.reveals };
  }
  return cached;
}

/** One attempt item per question, in the exam's own order — what starting a real attempt records. */
export function theologyExamItems(): ExamAttemptItem[] {
  return theologyExam().exam.questions.map((question): ExamAttemptItem => {
    const base = {
      questionId: question.id,
      version: question.version,
      primaryConceptId: question.primaryConceptId,
    };
    switch (question.kind) {
      case "single_choice":
      case "true_false":
      case "multiple_select":
        return { ...base, kind: question.kind, choiceIds: question.choices.map((c) => c.id) };
      case "matching":
        return {
          ...base,
          kind: "matching",
          promptIds: question.prompts.map((p) => p.id),
          targetIds: question.targets.map((t) => t.id),
        };
      case "ordering":
        return { ...base, kind: "ordering", stepIds: question.steps.map((s) => s.id) };
    }
  });
}

function revealFor(questionId: Id): QuestionReveal {
  const reveal = theologyExam().reveals.find((entry) => entry.questionId === questionId);
  if (!reveal) throw new Error(`No reveal for ${questionId} — check the question ID`);
  return reveal;
}

/** The right answer to a question, in response shape — the fastest way to seed a correct answer. */
export function correctResponseFor(questionId: Id): ExamResponse {
  return revealFor(questionId).key;
}

/** Any answer other than the right one, for a single-choice or true/false question. */
export function wrongSingleChoiceResponseFor(questionId: Id): ExamResponse {
  const question = theologyExam().exam.questions.find((q) => q.id === questionId);
  const key = revealFor(questionId).key;
  if (!question || (question.kind !== "single_choice" && question.kind !== "true_false")) {
    throw new Error(`${questionId} is not a single-choice or true/false question`);
  }
  if (key.kind !== "single_choice" && key.kind !== "true_false") {
    throw new Error(`${questionId}'s key is not a single choice`);
  }
  const wrong = question.choices.find((choice) => choice.id !== key.choiceId);
  if (!wrong) throw new Error(`${questionId} has no other choice to be wrong with`);
  return { kind: question.kind, choiceId: wrong.id };
}

export type ExamAttemptSeed = {
  attemptId?: Id;
  examId?: string;
  examVersion?: number;
  mode?: ExamMode;
  startedAt?: string;
  /** A response per question ID, recorded in the order given. */
  responses?: Record<Id, ExamResponse>;
  /** A Study Mode check per question ID — only meaningful once that question has a response. */
  checks?: Record<Id, ExamCheck>;
  /** Marks the attempt submitted (Exam Mode) or finished (Study Mode) with this graded result. */
  completedResult?: ExamResult;
};

/** attempt-exam-test's default ID, for a test that doesn't care what it's called. */
export const DEFAULT_ATTEMPT_ID = "attempt-exam-test";

/**
 * Seeds an exam attempt onto `state` by dispatching the same store actions
 * the real screens do (`exam/startAttempt`, `exam/recordResponse`,
 * `exam/checkResponse`, `exam/completeAttempt`) — so a seeded test and the
 * real flow can never drift apart.
 */
export function withExamAttempt(state: AppState, seed: ExamAttemptSeed = {}): AppState {
  const attemptId = seed.attemptId ?? DEFAULT_ATTEMPT_ID;
  const examId = seed.examId ?? "THEO-01-01";
  const examVersion = seed.examVersion ?? 4;
  const mode = seed.mode ?? "exam";
  const startedAt = seed.startedAt ?? "2026-09-28T07:00:00.000Z";

  let next = appReducer(state, {
    type: "exam/startAttempt",
    attemptId,
    examId,
    examVersion,
    mode,
    items: theologyExamItems(),
    at: startedAt,
  });

  const checks = new Map(Object.entries(seed.checks ?? {}));
  for (const [questionId, response] of Object.entries(seed.responses ?? {})) {
    next = appReducer(next, {
      type: "exam/recordResponse",
      attemptId,
      questionId,
      response,
      at: startedAt,
    });

    const check = checks.get(questionId);
    if (check) {
      next = appReducer(next, {
        type: "exam/checkResponse",
        attemptId,
        questionId,
        correct: check.correct,
        at: check.at,
      });
    }
  }

  if (seed.completedResult) {
    next = appReducer(next, {
      type: "exam/completeAttempt",
      attemptId,
      result: seed.completedResult,
      at: startedAt,
    });
  }

  return next;
}

const BANDS = [
  { minPercent: 90, label: "Mastered" },
  { minPercent: 80, label: "Strong" },
  { minPercent: 70, label: "Developing" },
  { minPercent: 0, label: "Review Recommended" },
];

function bandFor(percentage: number): string {
  const band = BANDS.find((entry) => percentage >= entry.minPercent);
  return band ? band.label : "Review Recommended";
}

export type ExamResultSeed = {
  mode?: ExamMode;
  /** Answered, but scored wrong. */
  incorrectQuestionIds?: Id[];
  /** Never answered — scored wrong, same as any other miss. */
  unansweredQuestionIds?: Id[];
  /** Practice: raw score kept, but every concept flattens to "Not enough evidence". */
  practice?: boolean;
};

/**
 * A graded `ExamResult` for the real THEO-01-01 exam: every question correct
 * except the ones named wrong or left unanswered. Concept labels follow the
 * owner's rule (fewer than 3 observations: Not enough evidence; 3 or more at
 * 80%+: Strength; 3 or more under 80%: Needs review) from the exam's own
 * `primaryConceptId`s — not recomputed by the app, so this never drifts from
 * whatever the store or results screen does on its own.
 */
export function theologyExamResult(seed: ExamResultSeed = {}): ExamResult {
  const { exam } = theologyExam();
  const incorrect = new Set(seed.incorrectQuestionIds ?? []);
  const unanswered = new Set(seed.unansweredQuestionIds ?? []);
  const isCorrect = (questionId: Id) => !incorrect.has(questionId) && !unanswered.has(questionId);

  const items: ExamItemResult[] = exam.questions.map((question) => ({
    questionId: question.id,
    correct: isCorrect(question.id),
    answered: !unanswered.has(question.id),
  }));

  const correct = items.filter((item) => item.correct).length;
  const total = items.length;
  const percentage = Math.round((correct / total) * 100);

  const byConcept = new Map<string, { correct: number; total: number }>();
  for (const question of exam.questions) {
    const entry = byConcept.get(question.primaryConceptId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (isCorrect(question.id)) entry.correct += 1;
    byConcept.set(question.primaryConceptId, entry);
  }

  const concepts: ExamConceptResult[] = [...byConcept.entries()].map(([conceptId, evidence]) => {
    const label: ExamConceptLabel = seed.practice
      ? "notEnoughEvidence"
      : evidence.total < 3
        ? "notEnoughEvidence"
        : evidence.correct / evidence.total >= 0.8
          ? "strength"
          : "needsReview";
    return { conceptId, correct: evidence.correct, total: evidence.total, label };
  });

  return {
    correct,
    total,
    percentage,
    band: seed.mode === "study" ? null : bandFor(percentage),
    items,
    concepts,
  };
}
