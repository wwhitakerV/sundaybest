import { Alert } from "react-native";
import { useReducer, useState } from "react";
import { useRouter } from "expo-router";

import type { PlanLength } from "@/types/domain";
import { useModalSession } from "@/hooks/use-modal-session";
import { readClipboardText } from "@/core/clipboard/read-clipboard-text";
import {
  useCreatePlanMutation,
  usePlanGenerationQuery,
  useResolveSermonMutation,
  useUserSettingsQuery,
} from "@/core/api/queries";
import { isApiError } from "@/core/api/api-error";
import {
  errorFeedback,
  selectionFeedback,
  tapFeedback,
} from "@/core/haptics/haptics";
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
 * New Plan backed by the real SundayBest API: live sermon search/resolve,
 * then one server-side generation job. The screen's two-step interaction stays
 * unchanged; only the source of truth has moved off the mock store.
 */
export function useNewPlanFlow() {
  const router = useRouter();
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

  const generationQuery = usePlanGenerationQuery(
    state.generationId ?? "",
    state.generationId !== null,
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
  const busy = resolveSermon.isPending || createPlan.isPending;
  const canContinue =
    !busy &&
    (state.step === "preview" ||
      (state.inputMode === "search"
        ? state.searchSelection !== null
        : state.link.trim() !== ""));

  const noCaptions =
    generationQuery.data?.generation.status === "failed" &&
    generationQuery.data.generation.error?.code === "noCaptions";

  function changeLink(link: string) {
    dispatch({ type: "linkChanged", link });
  }

  async function next() {
    if (busy) return;

    if (state.step === "preview") {
      tapFeedback();
      try {
        const created = await createPlan.mutateAsync({
          sermonId: state.checked.sermonId,
          lengthDays: state.days,
          quickCheckEnabled: state.quickCheck,
        });
        dispatch({
          type: "planCreated",
          planId: created.planId,
          generationId: created.generationId,
        });
        router.push(preparingHref(created.planId, created.generationId));
      } catch {
        errorFeedback();
        Alert.alert(
          "Couldn’t create your plan",
          "Check your connection and try again.",
        );
      }
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
    noCaptions,
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
    tryAnotherLink: () => {
      setShownChecked(null);
      dispatch({ type: "anotherLink" });
    },
    remindLater: () => session.exit(),
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
