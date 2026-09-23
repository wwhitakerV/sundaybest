/**
 * The Daily Study flow, in order. The single source of truth for how many
 * steps there are, what each is called, and how its label aligns under the
 * progress line (the row spreads inward from both ends: the first two
 * labels hug the left of their segment, the last two the right).
 */
export const STUDY_STEPS = [
  { key: "read", label: "Read", labelAlign: "left" },
  { key: "scripture", label: "Scripture", labelAlign: "left" },
  { key: "reflect", label: "Reflect", labelAlign: "right" },
  { key: "pray", label: "Pray", labelAlign: "right" },
] as const;

type StudyStep = (typeof STUDY_STEPS)[number];
export type StudyStepKey = StudyStep["key"];

export const STUDY_STEP_COUNT = STUDY_STEPS.length;

/** What a Previous or Next press should do from a given 0-indexed step. */
export type StudyNavAction = { type: "exit" } | { type: "finish" } | { type: "step"; step: number };

export function isLastStudyStep(step: number): boolean {
  return step === STUDY_STEP_COUNT - 1;
}

/** Previous from the first step leaves the flow; otherwise it steps back. */
export function getPreviousStudyAction(step: number): StudyNavAction {
  return step === 0 ? { type: "exit" } : { type: "step", step: step - 1 };
}

/** Next from the last step finishes the day; otherwise it steps forward. */
export function getNextStudyAction(step: number): StudyNavAction {
  return isLastStudyStep(step) ? { type: "finish" } : { type: "step", step: step + 1 };
}
