import type { ExamMode } from "@/types/domain";
import type { PassageLink, Subject } from "../types";
import { formatLevelName } from "./catalog";
import { formatDuration, formatQuestionCount } from "./labels";

type CatalogExam = Subject["exams"][number];

/** The next level up in an exam's subject — the next in the course — or null after its last. */
export function findNextExam(subjects: readonly Subject[], examId: string): CatalogExam | null {
  for (const { exams } of subjects) {
    const at = exams.findIndex((exam) => exam.examId === examId);
    if (at >= 0) return exams.at(at + 1) ?? null;
  }
  return null;
}

/** The questions on the concepts to review, in order — a short study that clears them. */
export function getReviewQuestions<T extends { primaryConceptId: string }>(
  questions: readonly T[],
  conceptIds: readonly string[],
): T[] {
  const due = new Set(conceptIds);
  return questions.filter((question) => due.has(question.primaryConceptId));
}

/**
 * The way into reviewing what was missed — "Review 2 concepts" — or null
 * with nothing to review, or while a study's already open (that one's
 * continued instead).
 */
export function describeReview(conceptCount: number, studyOpen: boolean): string | null {
  if (conceptCount === 0 || studyOpen) return null;
  return `Review ${conceptCount} ${conceptCount === 1 ? "concept" : "concepts"}`;
}

/** How much waits for review on an exam — "Review due · 2 concepts" — or null with none. */
export function formatReviewDue(conceptCount: number): string | null {
  if (conceptCount === 0) return null;
  return `Review due · ${conceptCount} ${conceptCount === 1 ? "concept" : "concepts"}`;
}

/** An objective, as the content gives it ("identify major divisions"), set as a sentence. */
export function formatObjective(objective: string): string {
  return `${objective.charAt(0).toUpperCase()}${objective.slice(1)}`;
}

/**
 * A subject's syllabus, from its exams that can be taken: what each will
 * have the learner able to do, under its level and title; and the passages
 * to read, each once, in the order they first come.
 */
export function buildSyllabus(
  rows: readonly {
    exam: CatalogExam;
    summary: { objectives: readonly string[]; sourceLinks: readonly PassageLink[] } | null;
  }[],
) {
  const available = rows.flatMap(({ exam, summary }) => (summary ? [{ exam, summary }] : []));
  const readings = new Map<string, PassageLink>();
  for (const { summary } of available) {
    for (const link of summary.sourceLinks) {
      if (!readings.has(link.reference)) readings.set(link.reference, link);
    }
  }
  return {
    objectives: available.map(({ exam, summary }) => ({
      examId: exam.examId,
      level: formatLevelName(exam.level),
      title: exam.title,
      items: summary.objectives.map(formatObjective),
    })),
    readings: [...readings.values()],
  };
}

/**
 * What a fresh attempt sets out before its first question — the conditions
 * it's sat under — and how its Start reads. A review's shorter study leaves
 * the exam's time out.
 */
export function describePreface({
  mode,
  count,
  duration,
}: {
  mode: ExamMode;
  count: number;
  duration: readonly [number, number] | null;
}): { start: string; lines: string[] } {
  const exam = mode === "exam";
  return {
    start: exam ? "Start the exam" : "Start studying",
    lines: [
      formatQuestionCount(count),
      ...(duration ? [`About ${formatDuration(duration)}`] : []),
      exam ? "Answers are revealed after you submit" : "Check each answer as you go, and see why",
      "You can leave and resume where you were",
    ],
  };
}
