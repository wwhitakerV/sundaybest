import type { Id } from "./common";
import type { Prayer, Reflection } from "./devotion";
import type { PlanGeneration } from "./generation";
import type { LibraryItem } from "./library";
import type { Plan, PlanDay } from "./plan";
import type { Quiz, QuizAnswer, QuizAttempt, QuizQuestion } from "./quiz";
import type { Reminder } from "./reminder";
import type { ScripturePassage } from "./scripture";
import type { SermonSource } from "./sermon";
import type { User, UserSettings } from "./user";

/** A collection of one kind of entity, looked up by ID. */
export type EntityTable<T extends { id: Id }> = Record<Id, T>;

/**
 * Everything the app knows, in one place: the user, their settings, and
 * every entity by kind. Entities point at each other by ID (`planId`,
 * `quizId`, …), never by nesting, so each lives in exactly one table.
 *
 * Only facts are stored — never what can be worked out from them. Progress
 * (days done, streaks, percentages, weekly counts) comes from the days'
 * completion records, and a quiz's score from its answers; see the store's
 * selectors.
 */
export type AppData = {
  user: User;
  settings: UserSettings;
  sermons: EntityTable<SermonSource>;
  plans: EntityTable<Plan>;
  planDays: EntityTable<PlanDay>;
  scripture: EntityTable<ScripturePassage>;
  reflections: EntityTable<Reflection>;
  prayers: EntityTable<Prayer>;
  quizzes: EntityTable<Quiz>;
  quizQuestions: EntityTable<QuizQuestion>;
  quizAttempts: EntityTable<QuizAttempt>;
  quizAnswers: EntityTable<QuizAnswer>;
  reminders: EntityTable<Reminder>;
  library: EntityTable<LibraryItem>;
  /** The plan being built right now, if any. */
  generation: PlanGeneration | null;
};
