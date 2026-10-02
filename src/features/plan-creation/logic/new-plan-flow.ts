import type { SermonPreview } from "@/core/plan-builder";
import type { PlanLength } from "@/types/domain";

/** The link checked on the first step, and the sermon it points to. */
export type CheckedLink = { url: string; sermon: SermonPreview };

type Shared = { link: string; days: PlanLength; quickCheck: boolean; planId: string | null };

/**
 * Where New Plan is: pasting a link (maybe with a reason it isn't one), or
 * previewing the sermon a checked link points to. A preview can't exist
 * without its checked link, and a paste step has none.
 */
export type NewPlanState =
  | ({ step: "paste"; linkError: string | null } & Shared)
  | ({ step: "preview"; checked: CheckedLink } & Shared);

export type NewPlanEvent =
  | { type: "linkChanged"; link: string }
  | { type: "linkRejected"; message: string }
  | { type: "linkAccepted"; checked: CheckedLink }
  | { type: "back" }
  | { type: "daysPicked"; days: PlanLength }
  | { type: "quickCheckSet"; quickCheck: boolean }
  | { type: "planCreated"; planId: string }
  | { type: "anotherLink" };

/** A fresh start: an empty link, with the user's default length and Quick Check. */
export function initialNewPlanState(defaults: {
  days: PlanLength;
  quickCheck: boolean;
}): NewPlanState {
  return { step: "paste", link: "", linkError: null, planId: null, ...defaults };
}

/** New Plan's legal moves. Anything not possible from where it is changes nothing. */
export function newPlanReducer(state: NewPlanState, event: NewPlanEvent): NewPlanState {
  const { link, days, quickCheck, planId } = state;
  switch (event.type) {
    case "linkChanged":
      return state.step === "paste" ? { ...state, link: event.link, linkError: null } : state;
    case "linkRejected":
      return state.step === "paste" ? { ...state, linkError: event.message } : state;
    case "linkAccepted":
      return state.step === "paste"
        ? { step: "preview", checked: event.checked, link, days, quickCheck, planId }
        : state;
    case "back":
      return state.step === "preview"
        ? { step: "paste", linkError: null, link, days, quickCheck, planId }
        : state;
    case "daysPicked":
      return state.step === "preview" ? { ...state, days: event.days } : state;
    case "quickCheckSet":
      return state.step === "preview" ? { ...state, quickCheck: event.quickCheck } : state;
    case "planCreated":
      return state.step === "preview" ? { ...state, planId: event.planId } : state;
    case "anotherLink":
      return { step: "paste", link: "", linkError: null, planId: null, days, quickCheck };
  }
}

/** The step's place in `NEW_PLAN_STEPS`. */
export function getNewPlanStepIndex(state: NewPlanState): 0 | 1 {
  return state.step === "paste" ? 0 : 1;
}
