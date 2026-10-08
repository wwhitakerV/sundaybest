import type { SermonPreview } from "../data/search-sermons";
import type { PlanLength } from "@/types/domain";

/** The two ways a sermon can enter the first step. */
type SermonInputMode = "paste" | "search";

/** The link checked on the first step, and the sermon it points to. */
export type CheckedLink = { sermonId: string; url: string; sermon: SermonPreview };

/** A search row is only a selection until Continue explicitly commits it. */
type SearchSelection = { id: string; checked: CheckedLink };

type Shared = {
  link: string;
  inputMode: SermonInputMode;
  searchQuery: string;
  searchSelection: SearchSelection | null;
  days: PlanLength;
  quickCheck: boolean;
};

/**
 * Where New Plan is: choosing a sermon (by paste or search), or previewing
 * the sermon that was chosen. Search selection deliberately does not advance
 * the flow; only Continue can turn it into a checked sermon.
 */
export type NewPlanState =
  | ({ step: "paste"; linkError: string | null } & Shared)
  | ({ step: "preview"; checked: CheckedLink } & Shared);

export type NewPlanEvent =
  | { type: "inputModeChanged"; inputMode: SermonInputMode }
  | { type: "searchQueryChanged"; searchQuery: string }
  | { type: "searchResultSelected"; selection: SearchSelection }
  | { type: "linkChanged"; link: string }
  | { type: "linkRejected"; message: string }
  | { type: "linkAccepted"; checked: CheckedLink }
  | { type: "back" }
  | { type: "daysPicked"; days: PlanLength }
  | { type: "quickCheckSet"; quickCheck: boolean };

/** A fresh start: paste mode, an empty link/search, and the user's plan defaults. */
export function initialNewPlanState(defaults: {
  days: PlanLength;
  quickCheck: boolean;
}): NewPlanState {
  return {
    step: "paste",
    link: "",
    inputMode: "paste",
    searchQuery: "",
    searchSelection: null,
    linkError: null,
    ...defaults,
  };
}

/** New Plan's legal moves. Anything not possible from where it is changes nothing. */
export function newPlanReducer(state: NewPlanState, event: NewPlanEvent): NewPlanState {
  const { link, inputMode, searchQuery, searchSelection, days, quickCheck } = state;

  switch (event.type) {
    case "inputModeChanged":
      return state.step === "paste"
        ? { ...state, inputMode: event.inputMode, linkError: null }
        : state;
    case "searchQueryChanged":
      return state.step === "paste" && state.inputMode === "search"
        ? { ...state, searchQuery: event.searchQuery, searchSelection: null }
        : state;
    case "searchResultSelected":
      return state.step === "paste" && state.inputMode === "search"
        ? { ...state, searchSelection: event.selection }
        : state;
    case "linkChanged":
      return state.step === "paste" && state.inputMode === "paste"
        ? { ...state, link: event.link, linkError: null }
        : state;
    case "linkRejected":
      return state.step === "paste" && state.inputMode === "paste"
        ? { ...state, linkError: event.message }
        : state;
    case "linkAccepted":
      return state.step === "paste"
        ? {
            step: "preview",
            checked: event.checked,
            link,
            inputMode,
            searchQuery,
            searchSelection,
            days,
            quickCheck,
          }
        : state;
    case "back":
      return state.step === "preview"
        ? {
            step: "paste",
            linkError: null,
            link,
            inputMode,
            searchQuery,
            searchSelection,
            days,
            quickCheck,
          }
        : state;
    case "daysPicked":
      return state.step === "preview" ? { ...state, days: event.days } : state;
    case "quickCheckSet":
      return state.step === "preview" ? { ...state, quickCheck: event.quickCheck } : state;
  }
}

/** The step's place in `NEW_PLAN_STEPS`. */
export function getNewPlanStepIndex(state: NewPlanState): 0 | 1 {
  return state.step === "paste" ? 0 : 1;
}
