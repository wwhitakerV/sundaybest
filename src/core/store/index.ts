/**
 * The app store: the single source of truth for application state, and the
 * pure selectors that read it. Mount `AppStoreProvider` once (AppProviders
 * does), then `useAppSelector` / `useAppDispatch` from any component.
 *
 * Selectors take the state first and are pure: same state, same answer.
 * Anything derived — progress, percentages, streaks, scores, weekly counts —
 * is a selector, never a stored value.
 */
export type { AppAction } from "./actions";
export { AppStoreProvider, useAppDispatch, useAppSelector, useToday } from "./AppStoreProvider";
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
