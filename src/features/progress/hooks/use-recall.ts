import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRouter } from "expo-router";

import { useQuickChecksQuery } from "@/core/api/reader-queries";
import { useRetakeQuizMutation } from "@/core/api/quiz-queries";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { quickCheckHref, studyHref } from "@/entities/plan";
import {
  MOSAIC_HINT,
  NOTHING_MISSED,
  RECALL_EMPTY,
  buildDayBlocks,
  countRecall,
  describePlace,
  getMissed,
  getQuestions,
  getMostRecentMiss,
} from "../logic/recall";

/**
 * The Quick Check page's view model: every Quick Check finished, as last
 * taken — how much was correct, a capsule for each, and the ones missed, one
 * in view with its right answer — moved between by their segments; opens
 * its study.
 */
export function useRecall() {
  const router = useRouter();
  const navigation = useNavigation();
  const query = useQuickChecksQuery();
  const retake = useRetakeQuizMutation();
  const quickChecks = query.data?.quickChecks ?? [];
  const questions = getQuestions(quickChecks);
  const missed = getMissed(quickChecks);

  const [shownId, setShownId] = useState<string | null>(null);
  // It opens on the most recent miss: the newest Quick Check's first missed question, its dot
  // marked in the grid's first block.
  if (shownId === null && missed.length > 0) {
    setShownId(getMostRecentMiss(missed));
  }
  // Any question can be shown — a miss, or one they got right — once it's tapped.
  const shown = questions.find((question) => question.id === shownId) ?? null;

  return {
    loading: query.isPending,
    error: query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    empty: query.isSuccess && quickChecks.length === 0 ? RECALL_EMPTY : null,
    counts: countRecall(quickChecks),
    blocks: buildDayBlocks(quickChecks),
    mosaicHint: questions.length > 0 ? MOSAIC_HINT : null,
    shown,
    /** "To revisit · 3 of 12" — or "Correct", for one they got right. */
    place: shown?.correct ? "Correct" : describePlace(quickChecks, shown?.id ?? null),
    /** A segment tapped: the question it stands for, right or not. */
    showQuestion: (id: string) => {
      if (id === shown?.id || !questions.some((question) => question.id === id)) return;
      selectionFeedback();
      setShownId(id);
    },
    studyLabel: shown ? `Open Day ${shown.dayNumber}` : "",
    retaking: retake.isPending,
    /** Its Quick Check taken again: a fresh attempt, opened on question 1. */
    takeAgain: async () => {
      if (!shown || retake.isPending) return;
      tapFeedback();
      try {
        await retake.mutateAsync(shown.quizId);
        router.push(quickCheckHref(shown.planId, shown.dayNumber));
      } catch {
        Alert.alert(
          "Couldn't start it again",
          "SundayBest couldn't reach your data. Check your connection and try again.",
        );
      }
    },
    // Nothing missed says so — until a question they got right is tapped, which then shows.
    nothingMissed:
      quickChecks.length > 0 && missed.length === 0 && shown === null ? NOTHING_MISSED : null,
    openStudy: () => {
      if (shown) router.push(studyHref(shown.planId, shown.dayNumber));
    },
    /** Every Quick Check, zooming out of its button — once there's one. */
    listHref: quickChecks.length > 0 ? ("/quick-checks" as const) : null,
    openList: () => tapFeedback(),
    back: () => router.back(),
    /** Dragging the grid holds the page's back swipe. */
    holdBackSwipe: (holding: boolean) => navigation.setOptions({ gestureEnabled: !holding }),
  } as const;
}
