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
