/** One place for TanStack Query keys so cache invalidation cannot drift across features. */
export const apiQueryKeys = {
  me: ["api", "me"] as const,
  settings: ["api", "settings"] as const,
  reminders: ["api", "reminders"] as const,
  planRoot: ["api", "plans"] as const,
  plans: ["api", "plans"] as const,
  progressRoot: ["api", "progress"] as const,
  progress: (weekStart: string) => ["api", "progress", weekStart] as const,
  /** Under the progress root, so finishing a study refreshes it. */
  week: (weekStart: string) => ["api", "progress", "week", weekStart] as const,
  /** Every week a plan ran in — under the progress root too. */
  weeks: ["api", "progress", "weeks"] as const,
  /** Every passage finished — under the progress root, so finishing a study refreshes it. */
  word: ["api", "progress", "word"] as const,
  /** Every reflection question in the reader's plans — under the progress root too. */
  reflections: ["api", "progress", "reflections"] as const,
  /** Every Quick Check finished, as last taken — under the progress root, so finishing one refreshes it. */
  quickChecks: ["api", "progress", "quick-checks"] as const,
  /** A search of the reader's plans, by its words — beside the plans, not under them. */
  planSearch: (query: string) => ["api", "plan-search", query] as const,
  sermonSearch: (query: string) => ["api", "sermons", "search", query] as const,
  plan: (planId: string) => ["api", "plans", planId] as const,
  /** The reader's builds not yet dismissed: what the generation bar shows. */
  currentGenerations: ["api", "plan-generations", "current"] as const,
  studyDay: (planId: string, dayNumber: number) =>
    ["api", "plans", planId, "days", dayNumber] as const,
  quizSession: (quizId: string) => ["api", "quizzes", quizId, "session"] as const,
  quizAttempt: (attemptId: string) => ["api", "quiz-attempts", attemptId] as const,
} as const;

/** Stands for any value in a key that's built from one (a week, a plan's id). */
const ANY = Symbol("any");

/** A key's shape: its fixed parts, `ANY` where a value goes. */
type KeyShape = readonly unknown[];

/**
 * Whether each kind of server data carries Scripture in the reader's Bible
 * translation — so changing the translation must fetch it again. Each one that
 * does gives its key's shape, written out; each one that doesn't is `false`.
 * Typed over every key: a new one won't compile until it's decided here, so no
 * screen can be left showing the old translation. A plan's Scripture (its Quick
 * Checks' verses included) is set when the plan is made, so it's not.
 */
const IN_READER_TRANSLATION: Record<keyof typeof apiQueryKeys, KeyShape | false> = {
  me: false,
  settings: false,
  reminders: false,
  planRoot: false,
  plans: false,
  progressRoot: false,
  progress: false,
  /** Its key verses, and the translation they're in. */
  week: ["api", "progress", "week", ANY],
  weeks: false,
  /** Every passage's text, and the translation it's in. */
  word: ["api", "progress", "word"],
  reflections: false,
  quickChecks: false,
  planSearch: false,
  sermonSearch: false,
  plan: false,
  currentGenerations: false,
  /** The day's passage, verse by verse. */
  studyDay: ["api", "plans", ANY, "days", ANY],
  quizSession: false,
  quizAttempt: false,
};

const TRANSLATION_SHAPES = Object.values(IN_READER_TRANSLATION).filter(
  (shape): shape is KeyShape => shape !== false,
);

/**
 * True for a query whose data is in the reader's Bible translation: the whole
 * key matches one of those shapes, part for part — never a root by its prefix.
 */
export function isInReaderTranslation(queryKey: readonly unknown[]): boolean {
  return TRANSLATION_SHAPES.some(
    (shape) =>
      shape.length === queryKey.length &&
      shape.every((part, index) => part === ANY || part === queryKey[index]),
  );
}

/** Keys for mutations other code watches after the screen that started them is gone. */
export const apiMutationKeys = {
  /** Asking for a new plan: the generation bar shows it until the server has it. */
  createPlan: ["api", "plans", "create"] as const,
} as const;
