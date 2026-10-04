import { useReducer, useState } from "react";
import { useRouter } from "expo-router";

import type { PlanLength } from "@/types/domain";
import { useModalSession } from "@/hooks/use-modal-session";
import { readClipboardText } from "@/core/clipboard/read-clipboard-text";
import { errorFeedback, selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { getPlanGeneration, getUserSettings, useAppSelector, useStoreActions } from "@/core/store";
import { lookUpSermon } from "../data/look-up-sermon";
import type { SermonSearchResult } from "../data/search-sermons";
import {
  getNewPlanStepIndex,
  initialNewPlanState,
  newPlanReducer,
  type CheckedLink,
} from "../logic/new-plan-flow";
import { preparingHref } from "../logic/routes";
import { checkSermonLink } from "../logic/sermon-link";
import { getLinkFeedback } from "../logic/link-feedback";
import { useSermonSearch } from "./use-sermon-search";

/**
 * New Plan's view model: where the flow is (`newPlanReducer`), and the
 * user's intents. Paste and search stay separate on step one, then Continue
 * explicitly commits either source into the same preview/build path.
 */
export function useNewPlanFlow() {
  const router = useRouter();
  const session = useModalSession();
  const settings = useAppSelector(getUserSettings);
  const generation = useAppSelector(getPlanGeneration);
  const { createAndBuildPlan, archivePlan } = useStoreActions();
  const [state, dispatch] = useReducer(
    newPlanReducer,
    { days: settings.defaultPlanLength, quickCheck: settings.quickCheckByDefault },
    initialNewPlanState,
  );
  const search = useSermonSearch(
    state.searchQuery,
    state.step === "paste" && state.inputMode === "search",
  );

  // The preview stays drawn while it fades out after Back; a fresh start clears it.
  const [shownChecked, setShownChecked] = useState<CheckedLink | null>(null);
  if (state.step === "preview" && state.checked !== shownChecked) setShownChecked(state.checked);

  const stepIndex = getNewPlanStepIndex(state);
  const canContinue =
    state.step === "preview" ||
    (state.inputMode === "search" ? state.searchSelection !== null : state.link.trim() !== "");
  const noCaptions =
    state.planId !== null &&
    generation?.planId === state.planId &&
    generation.status === "failed" &&
    generation.error?.code === "noCaptions";

  function changeLink(link: string) {
    dispatch({ type: "linkChanged", link });
  }

  function next() {
    if (state.step === "preview") {
      tapFeedback();
      const planId = createAndBuildPlan({
        sourceUrl: state.checked.url,
        title: state.checked.sermon.title,
        lengthDays: state.days,
        quickCheckEnabled: state.quickCheck,
      });
      dispatch({ type: "planCreated", planId });
      router.push(preparingHref(planId));
      return;
    }

    if (state.inputMode === "search") {
      if (!state.searchSelection) return;
      tapFeedback();
      dispatch({ type: "linkAccepted", checked: state.searchSelection.checked });
      return;
    }

    const result = checkSermonLink(state.link);
    if (!result.valid) {
      errorFeedback();
      dispatch({ type: "linkRejected", message: result.message });
      return;
    }

    tapFeedback();
    dispatch({
      type: "linkAccepted",
      checked: { url: result.url, sermon: lookUpSermon(result.url) },
    });
  }

  function selectSearchResult(result: SermonSearchResult) {
    if (state.step !== "paste" || state.inputMode !== "search") return;
    if (state.searchSelection?.id !== result.id) selectionFeedback();
    dispatch({
      type: "searchResultSelected",
      selection: {
        id: result.id,
        checked: { url: result.url, sermon: result.sermon },
      },
    });
  }

  return {
    state,
    stepIndex,
    shownChecked,
    noCaptions,
    canContinue,
    linkFeedback: getLinkFeedback(state),
    searchResults: search.results,
    searchStatus: search.status,
    submitSearch: search.submit,
    changeLink,
    showSearch: () => dispatch({ type: "inputModeChanged", inputMode: "search" }),
    showPaste: () => dispatch({ type: "inputModeChanged", inputMode: "paste" }),
    changeSearchQuery: (searchQuery: string) =>
      dispatch({ type: "searchQueryChanged", searchQuery }),
    clearSearch: () => dispatch({ type: "searchQueryChanged", searchQuery: "" }),
    selectSearchResult,
    paste: async () => {
      const copied = await readClipboardText();
      if (copied) changeLink(copied);
    },
    leading: () => {
      // Close on the first step; Back on the preview.
      if (state.step === "paste") session.exit();
      else dispatch({ type: "back" });
    },
    next,
    pickDays: (days: PlanLength) => {
      if (state.step === "preview" && days !== state.days) selectionFeedback();
      dispatch({ type: "daysPicked", days });
    },
    setQuickCheck: (quickCheck: boolean) => {
      if (state.step === "preview" && quickCheck !== state.quickCheck) selectionFeedback();
      dispatch({ type: "quickCheckSet", quickCheck });
    },
    /** Back to an empty link, putting away the plan that couldn't be built. */
    tryAnotherLink: () => {
      if (state.planId) archivePlan(state.planId);
      setShownChecked(null);
      dispatch({ type: "anotherLink" });
    },
    remindLater: () => session.exit(),
  };
}
