import type { ExamConceptLabel, ExamConceptResult } from "@/types/domain";

/**
 * A concept is a Strength at this share of its observations right or
 * better; below it, Needs review. The owner's rule of 2026-09-28 — the
 * content carries only the minimum number of observations, not this cut.
 */
const STRENGTH_PERCENT = 80;

function labelFor(correct: number, total: number, labelled: boolean): ExamConceptLabel {
  if (!labelled) return "notEnoughEvidence";
  return correct * 100 >= total * STRENGTH_PERCENT ? "strength" : "needsReview";
}

/**
 * How each primary concept went, in order of first appearance: right out
 * of total. Labelled only on enough independent evidence — `independent`
 * (an Exam Mode first attempt) and at least `minimumObservations` — else
 * Not enough evidence.
 */
export function getConceptResults(
  outcomes: readonly { primaryConceptId: string; correct: boolean }[],
  options: { independent: boolean; minimumObservations: number },
): ExamConceptResult[] {
  const concepts = [...new Set(outcomes.map((outcome) => outcome.primaryConceptId))];
  return concepts.map((conceptId) => {
    const observed = outcomes.filter((outcome) => outcome.primaryConceptId === conceptId);
    const correct = observed.filter((outcome) => outcome.correct).length;
    const total = observed.length;
    const labelled = options.independent && total >= options.minimumObservations;
    return { conceptId, correct, total, label: labelFor(correct, total, labelled) };
  });
}
