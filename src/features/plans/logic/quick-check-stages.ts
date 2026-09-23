/**
 * The Quick Check flow, in order: one screen whose body steps through these
 * stages while the header and action stay put (same pattern as
 * `study-steps.ts`). `counter` is the "N of 2" in the header and
 * `progressIndex` the active segment of its 3-segment tracker.
 */
export const QUICK_CHECK_STAGES = [
  {
    key: "question",
    counter: 1,
    progressIndex: 0,
    hasOptions: true,
    actionLabel: "Check answer",
    actionTestID: "quick-check-question-check-answer-button",
  },
  {
    key: "answer",
    counter: 1,
    progressIndex: 0,
    hasOptions: false,
    actionLabel: "Next question",
    actionTestID: "quick-check-answer-next-question-button",
  },
  {
    key: "finish-verse",
    counter: 2,
    progressIndex: 1,
    hasOptions: true,
    actionLabel: "Check answer",
    actionTestID: "quick-check-finish-verse-check-answer-button",
  },
  {
    key: "score",
    counter: 2,
    progressIndex: 2,
    hasOptions: false,
    actionLabel: "Done",
    actionTestID: "quick-check-score-done-button",
  },
] as const;

export type QuickCheckStage = (typeof QUICK_CHECK_STAGES)[number];

/** What the primary action does: advance to the next stage, or finish on the score. */
export type QuickCheckAction = { type: "done" } | { type: "stage"; stage: number };

export function getNextQuickCheckAction(stage: number): QuickCheckAction {
  return stage >= QUICK_CHECK_STAGES.length - 1
    ? { type: "done" }
    : { type: "stage", stage: stage + 1 };
}
