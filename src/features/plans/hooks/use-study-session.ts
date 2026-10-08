import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import type { Id, ReadingPaper } from "@/types/domain";
import { dayCompleteHref, quickCheckHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import { selectionFeedback, successFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  useCompleteStudyDayMutation,
  useCompleteStudyStepMutation,
} from "@/core/api/study-queries";
import { useUpdateSettingsMutation, useUserSettingsQuery } from "@/core/api/reader-queries";
import { readingTextOffsetSchema } from "@/core/api/contracts";
import {
  STUDY_STEPS,
  getNextStudyAction,
  getPreviousStudyAction,
  getStudyPages,
  isLastStudyPage,
  type StudyNavAction,
  type StudyPosition,
  type StudyStepKey,
} from "../logic/study-steps";
import { useReflectionAnswers } from "@/core/storage/reflection-answer-queries";
import { useStudyRoute } from "./use-study-route";

/** Where a study opens before its day has arrived. */
const START: StudyPosition = { step: 0, page: 0 };

/** Daily Study backed by the real API, with private reflection answers on-device only. */
export function useStudySession() {
  const router = useRouter();
  const session = useModalSession();
  const route = useStudyRoute();
  const { planId, dayNumber, plan, day, requestedStep } = route;
  const settingsQuery = useUserSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();
  const settings = settingsQuery.data?.settings;
  const reflectionIds = useMemo(
    () => day?.reflectionPrompts.map(({ id }) => id) ?? [],
    [day?.reflectionPrompts],
  );
  const reflections = useReflectionAnswers(reflectionIds);
  const completeStep = useCompleteStudyStepMutation(planId, dayNumber);
  const completeDay = useCompleteStudyDayMutation(planId, dayNumber);
  const pages = getStudyPages(day?.reflectionPrompts.length ?? 0);
  // Where the reader is, and in which day. A day opens where
  // `getInitialPosition` says the first time it arrives; from then on the
  // position is the reader's, so a refetch never moves them.
  const [placed, setPlaced] = useState<{ dayId: Id; position: StudyPosition } | null>(null);
  const redirectedToQuiz = useRef<string | null>(null);

  const desiredPosition = getInitialPosition(requestedStep, day?.progress.completedSteps ?? []);
  if (day && placed?.dayId !== day.id) {
    // A day just arrived: place the reader in it (React's "adjust state while
    // rendering", which re-renders at once with no extra commit).
    setPlaced({ dayId: day.id, position: desiredPosition });
  }
  const effectivePosition = day
    ? placed?.dayId === day.id
      ? placed.position
      : desiredPosition
    : (placed?.position ?? START);

  const quickCheckDue = Boolean(day?.quickCheckId && day.progress.status !== "completed");
  const allStudyStepsDone = STUDY_STEPS.every(({ key }) =>
    day?.progress.completedSteps.includes(key),
  );

  // Continue resumes the next real thing due. An explicit step route always
  // wins so completed study content can still be revisited from Plan Detail.
  useEffect(() => {
    if (
      !day ||
      requestedStep !== null ||
      !day.quickCheckId ||
      !allStudyStepsDone ||
      !quickCheckDue ||
      redirectedToQuiz.current === day.id
    ) {
      return;
    }
    redirectedToQuiz.current = day.id;
    router.replace(quickCheckHref(planId, dayNumber));
  }, [allStudyStepsDone, day, dayNumber, planId, quickCheckDue, requestedStep, router]);

  const busy = completeStep.isPending || completeDay.isPending;
  const redirectingToQuickCheck = Boolean(
    day && requestedStep === null && day.quickCheckId && allStudyStepsDone && quickCheckDue,
  );
  const loading =
    route.loading || settingsQuery.isPending || reflections.loading || redirectingToQuickCheck;

  if (!plan || !day) {
    return {
      found: false,
      loading,
      error: route.error ?? settingsQuery.error,
      retry: route.refetch,
      position: effectivePosition,
      pages,
      busy,
    } as const;
  }

  // An arrow, not a hoisted function, so it sees `day` as the found day the check above leaves.
  const apply = async (action: StudyNavAction) => {
    if (busy) return;

    if (action.type === "exit") {
      session.exit();
      return;
    }

    try {
      if (action.type === "move") {
        if (action.to.step > effectivePosition.step) {
          const completedStep = STUDY_STEPS.at(effectivePosition.step)?.key;
          const expectedStep = STUDY_STEPS.find(
            ({ key }) => !day.progress.completedSteps.includes(key),
          )?.key;
          if (
            completedStep &&
            completedStep === expectedStep &&
            !day.progress.completedSteps.includes(completedStep)
          ) {
            await completeStep.mutateAsync(completedStep);
          }
        }
        tapFeedback();
        setPlaced({ dayId: day.id, position: action.to });
        return;
      }

      // Finish always records Pray before moving on. The mutation is idempotent,
      // so revisiting a completed day is safe.
      if (!day.progress.completedSteps.includes("pray")) {
        const expectedStep = STUDY_STEPS.find(
          ({ key }) => !day.progress.completedSteps.includes(key),
        )?.key;
        if (expectedStep !== "pray") {
          Alert.alert(
            "Finish the earlier steps first",
            "Read, Scripture, Reflect and Pray are completed in order.",
          );
          return;
        }
        await completeStep.mutateAsync("pray");
      }

      if (quickCheckDue && day.quickCheckId) {
        tapFeedback();
        router.replace(quickCheckHref(planId, dayNumber));
        return;
      }

      await completeDay.mutateAsync();
      successFeedback();
      router.replace(dayCompleteHref(planId, dayNumber));
    } catch {
      Alert.alert(
        "Couldn't update study",
        "SundayBest couldn't save that progress. Check your connection and try again.",
      );
    }
  };

  return {
    found: true,
    loading,
    error: route.error ?? settingsQuery.error,
    retry: route.refetch,
    dayNumber,
    totalDays: plan.lengthDays,
    position: effectivePosition,
    pages,
    isLastPage: isLastStudyPage(effectivePosition, pages),
    busy,
    content: {
      day: {
        id: day.id,
        planId: day.planId,
        dayNumber: day.dayNumber,
        reading: day.reading,
        progress: day.progress,
      },
      scripture: day.scripture,
      reflections: day.reflectionPrompts,
      prayer: day.prayer,
    },
    answerFor: (reflectionId: Id) => reflections.answerFor(reflectionId),
    changeAnswer: (reflectionId: Id, answer: string) =>
      reflections.changeAnswer(reflectionId, answer),
    previous: () => void apply(getPreviousStudyAction(effectivePosition, pages)),
    next: () => void apply(getNextStudyAction(effectivePosition, pages)),
    close: () => void apply({ type: "exit" }),
    reading: {
      textOffset: settings?.readingTextOffset ?? 0,
      paper: settings?.readingPaper ?? "white",
      setTextOffset: (offset: number) => {
        const parsed = readingTextOffsetSchema.safeParse(offset);
        if (!parsed.success || parsed.data === settings?.readingTextOffset) return;
        selectionFeedback();
        updateSettings.mutate({ readingTextOffset: parsed.data });
      },
      setPaper: (paper: ReadingPaper) => {
        if (paper === settings?.readingPaper) return;
        selectionFeedback();
        updateSettings.mutate({ readingPaper: paper });
      },
    },
  } as const;
}

function getInitialPosition(
  requestedStep: StudyStepKey | null,
  completedSteps: readonly StudyStepKey[],
): StudyPosition {
  if (requestedStep) {
    const requestedIndex = STUDY_STEPS.findIndex(({ key }) => key === requestedStep);
    return { step: Math.max(0, requestedIndex), page: 0 };
  }

  const firstIncomplete = STUDY_STEPS.findIndex(({ key }) => !completedSteps.includes(key));
  return {
    step: firstIncomplete === -1 ? STUDY_STEPS.length - 1 : firstIncomplete,
    page: 0,
  };
}
