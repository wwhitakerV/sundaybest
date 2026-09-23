/**
 * The New Plan flow's two steps, in order: one screen whose body steps
 * through these while the header and action stay put. `key` doubles as the
 * testID prefix each step had as its own screen, so the header buttons and
 * actions keep their testIDs.
 */
export const NEW_PLAN_STEPS = [
  {
    key: "paste-sermon",
    counter: "1 of 2",
    leading: "close",
    actionLabel: "Continue",
    actionTestID: "paste-sermon-continue-button",
  },
  {
    key: "link-preview",
    counter: "2 of 2",
    leading: "back",
    actionLabel: "Create my plan",
    actionTestID: "link-preview-create-plan-button",
  },
] as const;

/** What the header's leading button does: close the flow, or step back. */
export type NewPlanLeadingAction = { type: "exit" } | { type: "step"; step: number };

/** What the primary action does: step forward, or hand off to Preparing. */
export type NewPlanAction = { type: "create" } | { type: "step"; step: number };

export function getNewPlanLeadingAction(step: number): NewPlanLeadingAction {
  return step === 0 ? { type: "exit" } : { type: "step", step: step - 1 };
}

export function getNextNewPlanAction(step: number): NewPlanAction {
  return step >= NEW_PLAN_STEPS.length - 1 ? { type: "create" } : { type: "step", step: step + 1 };
}
