import type {
  Id,
  IsoDate,
  IsoDateTime,
  LibraryItemKind,
  PlanGeneration,
  Reminder,
  StudyStep,
  UserSettings,
} from "@/types/domain";

/** Settings a user can change (not its ID, owner, or timestamps). */
type SettingsChanges = Partial<Omit<UserSettings, "id" | "createdAt" | "updatedAt" | "userId">>;

type ReminderChanges = Partial<Pick<Reminder, "enabled" | "time" | "days">>;

/**
 * Everything that can change the store. Each carries the moment it happened
 * (`at`) and any new record's ID, so the reducer stays pure: the same state
 * and action always give the same result.
 */
export type AppAction =
  | { type: "settings/update"; changes: SettingsChanges; at: IsoDateTime }
  | { type: "reminder/update"; reminderId: Id; changes: ReminderChanges; at: IsoDateTime }
  | { type: "plan/start"; planId: Id; today: IsoDate; at: IsoDateTime }
  | { type: "plan/archive"; planId: Id; at: IsoDateTime }
  | { type: "planDay/completeStep"; dayId: Id; step: StudyStep; today: IsoDate; at: IsoDateTime }
  | { type: "planDay/complete"; dayId: Id; today: IsoDate; at: IsoDateTime }
  | { type: "reflection/answer"; reflectionId: Id; answer: string; at: IsoDateTime }
  | { type: "prayer/markPrayed"; prayerId: Id; at: IsoDateTime }
  | { type: "quiz/startAttempt"; attemptId: Id; quizId: Id; at: IsoDateTime }
  | {
      type: "quiz/answer";
      answerId: Id;
      attemptId: Id;
      questionId: Id;
      choiceId: Id;
      at: IsoDateTime;
    }
  | { type: "quiz/completeAttempt"; attemptId: Id; at: IsoDateTime }
  | {
      type: "library/save";
      libraryItemId: Id;
      kind: LibraryItemKind;
      itemId: Id;
      note: string | null;
      at: IsoDateTime;
    }
  | { type: "library/remove"; libraryItemId: Id }
  | { type: "generation/set"; generation: PlanGeneration | null };
