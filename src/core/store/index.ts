/**
 * The app store: the single source of truth for application state, the pure
 * selectors that read it, and the typed actions that change it. Mount
 * `AppStoreProvider` once (AppProviders does); then components read with
 * `useAppSelector` and change state only through `useStoreActions`.
 *
 * Selectors take the state first and are pure: same state, same answer.
 * Anything derived — progress, percentages, streaks, scores, weekly counts —
 * is a selector, never a stored value.
 */
export type { AppAction, GeneratedPlanContent, PlanChanges } from "./actions";
export { AppStoreProvider, useAppSelector, useToday } from "./AppStoreProvider";
export { useStoreActions, type StoreActions } from "./use-store-actions";
export { appReducer } from "./reducer";
export { INITIAL_STATE, type AppState } from "./state";

export {
  getPrayerForDay,
  getReflectionsForDay,
  getScriptureForDay,
  getSermonById,
  getSermonForPlan,
} from "./selectors/content";
export { getPlanGeneration, isGeneratingPlan } from "./selectors/generation";
export { getLibraryItem, getLibraryItems, getLibraryPlans, isSaved } from "./selectors/library";
export {
  getActivePlan,
  getCompletedPlans,
  getCurrentPlanDay,
  getInProgressPlans,
  getPlanById,
  getPlanDay,
  getPlanDayById,
  getPlanDays,
  getPlans,
} from "./selectors/plans";
export {
  getCompletedDays,
  getPlanProgress,
  getProgressForDateRange,
  getProgressTotals,
  getStreak,
  getStudyDates,
  getWeeklyCompletionCounts,
  type DayActivity,
  type PlanProgress,
  type ProgressTotals,
  type Streak,
} from "./selectors/progress";
export {
  getAttemptAnswers,
  getQuestionResult,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getQuizScore,
  getQuizzesForPlan,
  isAnswerCorrect,
  type QuestionResult,
  type QuizScore,
} from "./selectors/quizzes";
export { getCurrentUser, getReminder, getReminders, getUserSettings } from "./selectors/user";
