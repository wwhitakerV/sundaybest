import { useMemo, type Dispatch } from "react";

import type {
  BibleTranslation,
  Id,
  LocalTime,
  PlanGenerationError,
  PlanGenerationStatus,
  PlanLength,
  StudyStep,
  TextSize,
} from "@/types/domain";

import type { AppAction, GeneratedPlanContent, PlanChanges } from "./actions";
import { useAppDispatch } from "./AppStoreProvider";
import { createId, getNow, getToday } from "./clock";

/**
 * The store's actions, bound to it: every way a screen can change app state.
 * Each stamps the time, makes any new IDs, and dispatches a typed action;
 * the reducer decides whether it's possible. A screen never mutates state
 * itself — it calls these, then reads the result back through selectors.
 */
function createStoreActions(dispatch: Dispatch<AppAction>) {
  const at = getNow;
  const today = getToday;

  return {
    // Plans ------------------------------------------------------------------

    /** Starts a draft plan from a pasted link. Returns its ID (the plan exists if it was accepted). */
    createPlan: (input: {
      sourceUrl: string;
      title: string;
      lengthDays: PlanLength;
      quickCheckEnabled: boolean;
    }): Id => {
      const planId = createId("plan");
      dispatch({ type: "plan/create", planId, sermonId: createId("sermon"), ...input, at: at() });
      return planId;
    },
    updatePlan: (planId: Id, changes: PlanChanges) => {
      dispatch({ type: "plan/update", planId, changes, at: at() });
    },
    startPlan: (planId: Id) => {
      dispatch({ type: "plan/start", planId, today: today(), at: at() });
    },
    completePlan: (planId: Id) => {
      dispatch({ type: "plan/complete", planId, at: at() });
    },
    archivePlan: (planId: Id) => {
      dispatch({ type: "plan/archive", planId, at: at() });
    },
    savePlan: (planId: Id) => {
      dispatch({ type: "plan/save", planId, libraryItemId: createId("library"), at: at() });
    },
    removeSavedPlan: (planId: Id) => {
      dispatch({ type: "plan/removeSaved", planId });
    },

    // Plan days ----------------------------------------------------------------

    startPlanDay: (dayId: Id) => {
      dispatch({ type: "planDay/start", dayId, today: today(), at: at() });
    },
    /** Marks one of a day's steps done. */
    updatePlanDay: (dayId: Id, completedStep: StudyStep) => {
      dispatch({ type: "planDay/update", dayId, completedStep, today: today(), at: at() });
    },
    completePlanDay: (dayId: Id) => {
      dispatch({ type: "planDay/complete", dayId, today: today(), at: at() });
    },

    // Reflections and prayer ---------------------------------------------------

    saveReflection: (reflectionId: Id, answer: string) => {
      dispatch({ type: "reflection/save", reflectionId, answer, at: at() });
    },
    updateReflection: (reflectionId: Id, answer: string) => {
      dispatch({ type: "reflection/update", reflectionId, answer, at: at() });
    },
    markPrayed: (prayerId: Id) => {
      dispatch({ type: "prayer/markPrayed", prayerId, at: at() });
    },

    // Quizzes ------------------------------------------------------------------

    /** Starts an attempt. Read it back with `getQuizAttempt` — an open one isn't replaced. */
    startQuizAttempt: (quizId: Id) => {
      dispatch({ type: "quiz/startAttempt", quizId, attemptId: createId("attempt"), at: at() });
    },
    selectQuizAnswer: (attemptId: Id, choiceId: Id) => {
      dispatch({ type: "quiz/selectAnswer", attemptId, choiceId, at: at() });
    },
    submitQuizAnswer: (attemptId: Id) => {
      dispatch({ type: "quiz/submitAnswer", attemptId, answerId: createId("answer"), at: at() });
    },
    moveToNextQuestion: (attemptId: Id) => {
      dispatch({ type: "quiz/nextQuestion", attemptId, at: at() });
    },
    completeQuizAttempt: (attemptId: Id) => {
      dispatch({ type: "quiz/completeAttempt", attemptId, at: at() });
    },

    // Settings -----------------------------------------------------------------

    updateReminderEnabled: (reminderId: Id, enabled: boolean) => {
      dispatch({ type: "settings/reminderEnabled", reminderId, enabled, at: at() });
    },
    updateReminderTime: (reminderId: Id, time: LocalTime) => {
      dispatch({ type: "settings/reminderTime", reminderId, time, at: at() });
    },
    updateBibleTranslation: (translation: BibleTranslation) => {
      dispatch({ type: "settings/bibleTranslation", translation, at: at() });
    },
    updateTextSize: (textSize: TextSize) => {
      dispatch({ type: "settings/textSize", textSize, at: at() });
    },

    // Progress -----------------------------------------------------------------

    recordDayCompletion: (dayId: Id) => {
      dispatch({ type: "progress/recordDayCompletion", dayId, today: today(), at: at() });
    },
    recordQuizCompletion: (attemptId: Id) => {
      dispatch({ type: "progress/recordQuizCompletion", attemptId, at: at() });
    },

    // Plan generation ----------------------------------------------------------

    startPlanGeneration: (planId: Id) => {
      dispatch({
        type: "generation/start",
        generationId: createId("generation"),
        planId,
        at: at(),
      });
    },
    updateGenerationStep: (status: PlanGenerationStatus) => {
      dispatch({ type: "generation/step", status, at: at() });
    },
    completePlanGeneration: (content: GeneratedPlanContent) => {
      dispatch({ type: "generation/complete", content, at: at() });
    },
    failPlanGeneration: (error: PlanGenerationError) => {
      dispatch({ type: "generation/fail", error, at: at() });
    },
    retryPlanGeneration: () => {
      dispatch({ type: "generation/retry", at: at() });
    },
  };
}

export type StoreActions = ReturnType<typeof createStoreActions>;

/** The store's actions, for a component: `const { completePlanDay } = useStoreActions()`. */
export function useStoreActions(): StoreActions {
  const dispatch = useAppDispatch();
  return useMemo(() => createStoreActions(dispatch), [dispatch]);
}
