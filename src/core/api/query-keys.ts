/** One place for TanStack Query keys so cache invalidation cannot drift across features. */
export const apiQueryKeys = {
  me: ["api", "me"] as const,
  settings: ["api", "settings"] as const,
  reminders: ["api", "reminders"] as const,
  planRoot: ["api", "plans"] as const,
  plans: ["api", "plans"] as const,
  progressRoot: ["api", "progress"] as const,
  progress: (weekStart: string) => ["api", "progress", weekStart] as const,
  sermonSearch: (query: string) => ["api", "sermons", "search", query] as const,
  plan: (planId: string) => ["api", "plans", planId] as const,
  /** The reader's builds not yet dismissed: what the generation bar shows. */
  currentGenerations: ["api", "plan-generations", "current"] as const,
  studyDay: (planId: string, dayNumber: number) =>
    ["api", "plans", planId, "days", dayNumber] as const,
  quizSession: (quizId: string) => ["api", "quizzes", quizId, "session"] as const,
  quizAttempt: (attemptId: string) => ["api", "quiz-attempts", attemptId] as const,
} as const;

/** True for a Daily Study day's key: `["api", "plans", planId, "days", dayNumber]`. */
export function isStudyDayQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "api" && queryKey[1] === "plans" && queryKey[3] === "days";
}

/** Keys for mutations other code watches after the screen that started them is gone. */
export const apiMutationKeys = {
  /** Asking for a new plan: the generation bar shows it until the server has it. */
  createPlan: ["api", "plans", "create"] as const,
} as const;
