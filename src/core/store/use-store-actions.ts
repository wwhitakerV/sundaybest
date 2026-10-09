import { useMemo, type Dispatch } from "react";

import type {
  BibleTranslation,
  ExamAttemptItem,
  ExamMode,
  ExamResponse,
  ExamResult,
  Id,
  LocalTime,
  PlanGenerationError,
  PlanGenerationStatus,
  PlanLength,
  StudyStep,
  ReadingPaper,
  TextSize,
  ThemePreference,
  Weekday,
} from "@/types/domain";

import type { AppAction, GeneratedPlanContent, PlanChanges, ReflectionWrite } from "./actions";
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
    // User -------------------------------------------------------------------

    setDisplayName: (displayName: string | null) => {
      dispatch({ type: "user/displayName", displayName, at: at() });
    },
    completeOnboarding: () => {
      dispatch({ type: "user/completeOnboarding", at: at() });
    },

    // Plans ------------------------------------------------------------------

    /** Makes a plan and starts building it — one step. Returns the new plan's ID. */
    createAndBuildPlan: (input: {
      sourceUrl: string;
      title: string;
      lengthDays: PlanLength;
      quickCheckEnabled: boolean;
    }): Id => {
      const planId = createId("plan");
      dispatch({
        type: "plan/createAndBuild",
        planId,
        sermonId: createId("sermon"),
        generationId: createId("generation"),
        ...input,
        at: at(),
      });
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

    // Plan days ----------------------------------------------------------------

    startPlanDay: (dayId: Id) => {
      dispatch({ type: "planDay/start", dayId, today: today(), at: at() });
    },
    /** Marks one of a day's steps done. */
    updatePlanDay: (dayId: Id, completedStep: StudyStep) => {
      dispatch({ type: "planDay/update", dayId, completedStep, today: today(), at: at() });
    },
    /** Finishes the day from the study: its prayer prayed, then the day complete — one step. */
    finishPlanDay: (dayId: Id, prayerId: Id | null) => {
      dispatch({ type: "planDay/finish", dayId, prayerId, today: today(), at: at() });
    },

    // Reflections and prayer ---------------------------------------------------

    /** Writes everything typed this visit at once. */
    commitReflections: (writes: readonly ReflectionWrite[]) => {
      dispatch({ type: "reflection/commit", writes, at: at() });
    },
    markPrayerPrayed: (prayerId: Id) => {
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

    // Theology exams -----------------------------------------------------------

    /** Starts an attempt. Returns its ID — it exists only if no attempt in that mode was already open. */
    startExamAttempt: (input: {
      examId: string;
      examVersion: number;
      mode: ExamMode;
      items: ExamAttemptItem[];
    }): Id => {
      const attemptId = createId("exam-attempt");
      dispatch({ type: "exam/startAttempt", attemptId, ...input, at: at() });
      return attemptId;
    },
    recordExamResponse: (attemptId: Id, questionId: Id, response: ExamResponse) => {
      dispatch({ type: "exam/recordResponse", attemptId, questionId, response, at: at() });
    },
    checkExamResponse: (attemptId: Id, questionId: Id, correct: boolean) => {
      dispatch({ type: "exam/checkResponse", attemptId, questionId, correct, at: at() });
    },
    completeExamAttempt: (attemptId: Id, result: ExamResult) => {
      dispatch({ type: "exam/completeAttempt", attemptId, result, at: at() });
    },

    // Settings -----------------------------------------------------------------

    setReminderEnabled: (reminderId: Id, enabled: boolean) => {
      dispatch({ type: "settings/reminderEnabled", reminderId, enabled, at: at() });
    },
    setReminderTime: (reminderId: Id, time: LocalTime) => {
      dispatch({ type: "settings/reminderTime", reminderId, time, at: at() });
    },
    setReminderDays: (reminderId: Id, days: Weekday[]) => {
      dispatch({ type: "settings/reminderDays", reminderId, days, at: at() });
    },
    /** Turns the reminder on at a time — one step. */
    turnOnReminderAt: (reminderId: Id, time: LocalTime) => {
      dispatch({ type: "settings/reminderOn", reminderId, time, at: at() });
    },
    updateBibleTranslation: (translation: BibleTranslation) => {
      dispatch({ type: "settings/bibleTranslation", translation, at: at() });
    },
    updateTextSize: (textSize: TextSize) => {
      dispatch({ type: "settings/textSize", textSize, at: at() });
    },
    updateTheme: (theme: ThemePreference) => {
      dispatch({ type: "settings/theme", theme, at: at() });
    },
    updateDefaultPlanLength: (lengthDays: PlanLength) => {
      dispatch({ type: "settings/defaultPlanLength", lengthDays, at: at() });
    },
    updateQuickCheckByDefault: (enabled: boolean) => {
      dispatch({ type: "settings/quickCheckByDefault", enabled, at: at() });
    },
    updateHapticsEnabled: (enabled: boolean) => {
      dispatch({ type: "settings/hapticsEnabled", enabled, at: at() });
    },
    /** The Daily Study's text size: points from its designed size (`READING_TEXT_SIZE`). */
    setReadingTextOffset: (offset: number) => {
      dispatch({ type: "settings/readingTextOffset", offset, at: at() });
    },
    setReadingPaper: (paper: ReadingPaper) => {
      dispatch({ type: "settings/readingPaper", paper, at: at() });
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

/** The store's actions, for a component: `const { finishPlanDay } = useStoreActions()`. */
export function useStoreActions(): StoreActions {
  const dispatch = useAppDispatch();
  return useMemo(() => createStoreActions(dispatch), [dispatch]);
}
