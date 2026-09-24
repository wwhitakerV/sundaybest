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

/**
 * Where the user is in the flow: a step (0-indexed), and a page within it.
 * Most steps are one page; Reflect has a page per question.
 */
export type StudyPosition = { step: number; page: number };

/** What a Previous or Next press should do from a position. */
export type StudyNavAction =
  { type: "exit" } | { type: "finish" } | { type: "move"; to: StudyPosition };

const REFLECT_STEP = STUDY_STEPS.findIndex((step) => step.key === "reflect");

/** Pages in each step, in order: one each, and a page per question on Reflect (at least one). */
export function getStudyPages(reflectionCount: number): number[] {
  return STUDY_STEPS.map((_, index) => (index === REFLECT_STEP ? Math.max(1, reflectionCount) : 1));
}

function pagesIn(pages: readonly number[], step: number): number {
  return Math.max(1, pages.at(step) ?? 1);
}

/** Whether this is the flow's very last page — where Next finishes the day. */
export function isLastStudyPage({ step, page }: StudyPosition, pages: readonly number[]): boolean {
  return step === STUDY_STEP_COUNT - 1 && page >= pagesIn(pages, step) - 1;
}

/** Next turns the page within a step, then moves to the next step; from the very last page it finishes the day. */
export function getNextStudyAction(
  position: StudyPosition,
  pages: readonly number[],
): StudyNavAction {
  const { step, page } = position;
  if (page < pagesIn(pages, step) - 1) return { type: "move", to: { step, page: page + 1 } };
  if (step >= STUDY_STEP_COUNT - 1) return { type: "finish" };
  return { type: "move", to: { step: step + 1, page: 0 } };
}

/** Previous turns back a page, then to the previous step's last page; from the very first page it leaves the flow. */
export function getPreviousStudyAction(
  position: StudyPosition,
  pages: readonly number[],
): StudyNavAction {
  const { step, page } = position;
  if (page > 0) return { type: "move", to: { step, page: page - 1 } };
  if (step === 0) return { type: "exit" };
  return { type: "move", to: { step: step - 1, page: pagesIn(pages, step - 1) - 1 } };
}

/** A position as one running page number across the whole flow, from 0. */
export function toPageIndex({ step, page }: StudyPosition, pages: readonly number[]): number {
  const before = STUDY_STEPS.slice(0, step).reduce(
    (total, _, index) => total + pagesIn(pages, index),
    0,
  );
  return before + page;
}

/** A running page number back as its step and page — the last page for one past the end. */
export function fromPageIndex(index: number, pages: readonly number[]): StudyPosition {
  let remaining = Math.max(0, index);
  for (let step = 0; step < STUDY_STEP_COUNT; step += 1) {
    const count = pagesIn(pages, step);
    if (remaining < count) return { step, page: remaining };
    remaining -= count;
  }
  const last = STUDY_STEP_COUNT - 1;
  return { step: last, page: pagesIn(pages, last) - 1 };
}
