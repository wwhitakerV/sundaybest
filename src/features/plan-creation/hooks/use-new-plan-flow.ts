import { useReducer, useState } from "react";

import type { PlanLength } from "@/types/domain";
import { useModalSession } from "@/hooks/use-modal-session";
import { readClipboardText } from "@/core/clipboard/read-clipboard-text";
import { useCreatePlanMutation, useResolveSermonMutation } from "@/core/api/plan-queries";
import { useUserSettingsQuery } from "@/core/api/reader-queries";
import { isApiError } from "@/core/api/api-error";
import { errorFeedback, selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { lookUpSermon } from "../data/look-up-sermon";
import type { SermonSearchResult } from "../data/search-sermons";
import {
  getNewPlanStepIndex,
  initialNewPlanState,
  newPlanReducer,
  type CheckedLink,
} from "../logic/new-plan-flow";
import { checkSermonLink } from "../logic/sermon-link";
import { getLinkFeedback } from "../logic/link-feedback";
import { useSermonSearch } from "./use-sermon-search";

/**
 * New Plan backed by the real SundayBest API: live sermon search/resolve,
 * then one server-side generation job. Asking for the plan closes New Plan at
 * once; the generation bar above the tabs follows the build from there.
 */
export function useNewPlanFlow() {
  const session = useModalSession();
  const settingsQuery = useUserSettingsQuery();
  const resolveSermon = useResolveSermonMutation();
  const createPlan = useCreatePlanMutation();

  const defaults = settingsQuery.data?.settings;
  const [state, dispatch] = useReducer(
    newPlanReducer,
    {
      days: defaults?.defaultPlanLength ?? 5,
      quickCheck: defaults?.quickCheckByDefault ?? true,
    },
    initialNewPlanState,
  );

  const search = useSermonSearch(
    state.searchQuery,
    state.step === "paste" && state.inputMode === "search",
  );

  // The preview stays drawn while it fades out after Back; a fresh start clears it.
  const [shownChecked, setShownChecked] = useState<CheckedLink | null>(null);
  if (state.step === "preview" && state.checked !== shownChecked) {
    setShownChecked(state.checked);
  }

  const stepIndex = getNewPlanStepIndex(state);
  const busy = resolveSermon.isPending;
  const canContinue =
    !busy &&
    (state.step === "preview" ||
      (state.inputMode === "search" ? state.searchSelection !== null : state.link.trim() !== ""));

  function changeLink(link: string) {
    dispatch({ type: "linkChanged", link });
  }

  async function next() {
    if (busy) return;

    if (state.step === "preview") {
      // Nothing waits on the server: the request carries on in the query
      // client after New Plan closes, and the generation bar shows it —
      // building, or failed to start, with a retry.
      tapFeedback();
      createPlan.mutate({
        sermonId: state.checked.sermonId,
        lengthDays: state.days,
        quickCheckEnabled: state.quickCheck,
      });
      session.exit();
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
    try {
      const { sermon } = await resolveSermon.mutateAsync({ url: result.url });
      dispatch({
        type: "linkAccepted",
        checked: {
          sermonId: sermon.id,
          url: sermon.canonicalUrl,
          sermon: lookUpSermon(sermon),
        },
      });
    } catch (cause) {
      errorFeedback();
      dispatch({ type: "linkRejected", message: resolveErrorMessage(cause) });
    }
  }

  function selectSearchResult(result: SermonSearchResult) {
    if (state.step !== "paste" || state.inputMode !== "search") return;
    if (state.searchSelection?.id !== result.id) selectionFeedback();
    dispatch({
      type: "searchResultSelected",
      selection: {
        id: result.id,
        checked: {
          sermonId: result.id,
          url: result.url,
          sermon: result.sermon,
        },
      },
    });
  }

  return {
    state,
    stepIndex,
    shownChecked,
    canContinue,
    busy,
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
  };
}

function resolveErrorMessage(cause: unknown): string {
  if (!isApiError(cause)) {
    return "We couldn’t check that video. Try again in a moment.";
  }

  switch (cause.code) {
    case "SERMON_UNSUPPORTED":
      return "For now, paste a YouTube sermon link.";
    case "SERMON_UNAVAILABLE":
      return "We couldn’t open that video. Make sure it’s public and try again.";
    default:
      return cause.kind === "network" || cause.kind === "timeout"
        ? "We couldn’t reach the sermon right now. Check your connection and try again."
        : "We couldn’t check that video. Try again in a moment.";
  }
}
