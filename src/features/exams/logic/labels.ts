import type { ExamConceptLabel, ExamInteractionKind, ExamMode } from "@/types/domain";

/**
 * What a question asks of the learner, by kind. A multiple-select question
 * never says how many answers are right.
 */
export function getInstruction(kind: ExamInteractionKind): string {
  switch (kind) {
    case "single_choice":
      return "Choose one";
    case "true_false":
      return "True or false";
    case "multiple_select":
      return "Select all that apply";
    case "matching":
      return "Match each one";
    case "ordering":
      return "Put these in order";
  }
}

/** An exam's length: "8–12 min", or "10 min" when there's no range. */
export function formatDuration([shortest, longest]: readonly [number, number]): string {
  return shortest === longest ? `${shortest} min` : `${shortest}–${longest} min`;
}

/** A concept's evidence label, in words. */
export function formatConceptLabel(label: ExamConceptLabel): string {
  switch (label) {
    case "strength":
      return "Strength";
    case "needsReview":
      return "Needs review";
    case "notEnoughEvidence":
      return "Not enough evidence";
  }
}

/** The overview's kicker: "Scripture & Reading · Foundations". */
export function formatDomainAndLevel(domain: string, level: string): string {
  return `${domain} · ${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}

/** "15 questions", "1 question". */
export function formatQuestionCount(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}

/** An attempt's mode, by name — and "Practice" after it when it doesn't count toward concepts. */
export function formatModeLabel(mode: ExamMode, practice: boolean): string {
  const name = mode === "study" ? "Study Mode" : "Exam Mode";
  return practice ? `${name} · Practice` : name;
}
