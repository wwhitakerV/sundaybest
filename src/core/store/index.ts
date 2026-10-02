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
export type { AppAction, GeneratedPlanContent, PlanChanges, ReflectionWrite } from "./actions";
export { AppStoreProvider, useAppSelector, useToday } from "./AppStoreProvider";
export { useStoreActions, type StoreActions } from "./use-store-actions";
export { appReducer } from "./reducer";
export { INITIAL_STATE, type AppState } from "./state";
export { GENERATION_STAGES } from "./transitions";
export { READING_TEXT_SIZE, isReadingTextOffset } from "./reducers/settings";

export {
  getDayMinutes,
  getDayScripture,
  getPrayerForDay,
  getReflectionsForDay,
  getScriptureForDay,
  getSermonById,
  getSermonForPlan,
} from "./selectors/content";
export {
  getExamAttempt,
  getExamConceptsForReview,
  getLatestCompletedExamAttempt,
  getLatestOpenExamAttempt,
  getOpenExamAttempt,
  hasRevealedExamAnswers,
} from "./selectors/exams";
export {
  getExamItemResponse,
  getMissedConcepts,
  isExamQuestionRevealed,
  isExamResponseComplete,
  isExamResponseValid,
} from "./exam-responses";
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
  getSamplePlan,
  getUserPlans,
} from "./selectors/plans";
export {
  getCompletedDays,
  getPlanProgress,
  getPlanSummary,
  getProgressForDateRange,
  getProgressTotals,
  getUpNext,
  getStreak,
  getStudyDates,
  getWeeklyCompletionCounts,
  type DayActivity,
  type PlanProgress,
  type ProgressTotals,
  type UpNext,
  type PlanSummary,
  type Streak,
} from "./selectors/progress";
export {
  getAttemptAnswers,
  getQuestionResult,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getLatestQuizScore,
  getQuizScore,
  getQuizStatus,
  getQuizzesForPlan,
  getQuickCheckStanding,
  isAnswerCorrect,
  isChoiceCorrect,
  type QuestionResult,
  type QuickCheckStanding,
  type QuizScore,
  type QuizStatus,
} from "./selectors/quizzes";
export { getCurrentUser, getReminder, getReminders, getUserSettings } from "./selectors/user";
