/** One place for TanStack Query keys so cache invalidation cannot drift across features. */
export const apiQueryKeys = {
  me: ["api", "me"] as const,
  settings: ["api", "settings"] as const,
  reminders: ["api", "reminders"] as const,
  plans: ["api", "plans"] as const,
  plan: (planId: string) => ["api", "plans", planId] as const,
  generation: (generationId: string) => ["api", "plan-generations", generationId] as const,
  studyDay: (planId: string, dayNumber: number) =>
    ["api", "plans", planId, "days", dayNumber] as const,
  quizAttempt: (attemptId: string) => ["api", "quiz-attempts", attemptId] as const,
} as const;
