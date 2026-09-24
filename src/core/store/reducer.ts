import type { AppAction } from "./actions";
import { completePlanDay, startPlanDay, updatePlanDay } from "./reducers/days";
import { clearReflection, markPrayed, saveReflection, updateReflection } from "./reducers/devotion";
import {
  completePlanGeneration,
  failPlanGeneration,
  retryPlanGeneration,
  startPlanGeneration,
  updateGenerationStep,
} from "./reducers/generation";
import {
  archivePlan,
  completePlan,
  createPlan,
  removeSavedPlan,
  savePlan,
  startPlan,
  updatePlan,
} from "./reducers/plans";
import {
  completeQuizAttempt,
  moveToNextQuestion,
  selectQuizAnswer,
  startQuizAttempt,
  submitQuizAnswer,
} from "./reducers/quizzes";
import {
  updateBibleTranslation,
  updateReminderEnabled,
  updateReminderTime,
  updateTextSize,
} from "./reducers/settings";
import type { AppState } from "./state";

/**
 * The store's reducer: every state change goes through here. Pure — it never
 * reads the clock or makes IDs (both come in on the action) — and it never
 * mutates: a change returns new objects, and an action that isn't possible
 * from the current state returns the state untouched.
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "plan/create":
      return createPlan(state, action);
    case "plan/update":
      return updatePlan(state, action);
    case "plan/start":
      return startPlan(state, action);
    case "plan/complete":
      return completePlan(state, action);
    case "plan/archive":
      return archivePlan(state, action);
    case "plan/save":
      return savePlan(state, action);
    case "plan/removeSaved":
      return removeSavedPlan(state, action);

    case "planDay/start":
      return startPlanDay(state, action);
    case "planDay/update":
      return updatePlanDay(state, action);
    // Progress is worked out from completion records, so recording a day's
    // completion *is* completing it — either way, once.
    case "planDay/complete":
    case "progress/recordDayCompletion":
      return completePlanDay(state, action);

    case "reflection/save":
      return saveReflection(state, action);
    case "reflection/update":
      return updateReflection(state, action);
    case "reflection/clear":
      return clearReflection(state, action);
    case "prayer/markPrayed":
      return markPrayed(state, action);

    case "quiz/startAttempt":
      return startQuizAttempt(state, action);
    case "quiz/selectAnswer":
      return selectQuizAnswer(state, action);
    case "quiz/submitAnswer":
      return submitQuizAnswer(state, action);
    case "quiz/nextQuestion":
      return moveToNextQuestion(state, action);
    case "quiz/completeAttempt":
    case "progress/recordQuizCompletion":
      return completeQuizAttempt(state, action);

    case "settings/reminderEnabled":
      return updateReminderEnabled(state, action);
    case "settings/reminderTime":
      return updateReminderTime(state, action);
    case "settings/bibleTranslation":
      return updateBibleTranslation(state, action);
    case "settings/textSize":
      return updateTextSize(state, action);

    case "generation/start":
      return startPlanGeneration(state, action);
    case "generation/step":
      return updateGenerationStep(state, action);
    case "generation/complete":
      return completePlanGeneration(state, action);
    case "generation/fail":
      return failPlanGeneration(state, action);
    case "generation/retry":
      return retryPlanGeneration(state, action);
  }
}
