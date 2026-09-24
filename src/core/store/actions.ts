import type {
  BibleTranslation,
  Id,
  IsoDate,
  IsoDateTime,
  LocalTime,
  PlanDay,
  PlanGenerationError,
  PlanGenerationStatus,
  PlanLength,
  Prayer,
  Quiz,
  QuizQuestion,
  Reflection,
  ScripturePassage,
  SermonSource,
  StudyStep,
  TextSize,
} from "@/types/domain";

/** What a user can change about a plan (length and Quick Check only while it's a draft). */
export type PlanChanges = Partial<{
  title: string;
  lengthDays: PlanLength;
  quickCheckEnabled: boolean;
}>;

/** What building a plan produced: its sermon's details and every record of its days. */
export type GeneratedPlanContent = {
  title: string;
  sermon: Pick<
    SermonSource,
    | "title"
    | "speaker"
    | "church"
    | "thumbnailUrl"
    | "durationSeconds"
    | "publishedOn"
    | "transcriptStatus"
    | "transcript"
  >;
  days: PlanDay[];
  scripture: ScripturePassage[];
  reflections: Reflection[];
  prayers: Prayer[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
};

/** Present on every action: when it happened. */
type At = { at: IsoDateTime };

/**
 * Every way the store can change. Actions carry the moment they happened
 * (`at`), the calendar day when it matters (`today`), and the IDs of any
 * records they create — so the reducer never reads the clock or makes IDs,
 * and the same state and action always give the same result.
 *
 * An action that isn't possible from the current state (completing a locked
 * day, finishing a quiz with questions unanswered, …) changes nothing.
 */
export type AppAction =
  // Plans
  | ({
      type: "plan/create";
      planId: Id;
      sermonId: Id;
      sourceUrl: string;
      /** The sermon's title, as far as it's known yet — the plan's working title. */
      title: string;
      lengthDays: PlanLength;
      quickCheckEnabled: boolean;
    } & At)
  | ({ type: "plan/update"; planId: Id; changes: PlanChanges } & At)
  | ({ type: "plan/start"; planId: Id; today: IsoDate } & At)
  | ({ type: "plan/complete"; planId: Id } & At)
  | ({ type: "plan/archive"; planId: Id } & At)
  | ({ type: "plan/save"; planId: Id; libraryItemId: Id } & At)
  | { type: "plan/removeSaved"; planId: Id }
  // Plan days
  | ({ type: "planDay/start"; dayId: Id; today: IsoDate } & At)
  | ({ type: "planDay/update"; dayId: Id; completedStep: StudyStep; today: IsoDate } & At)
  | ({ type: "planDay/complete"; dayId: Id; today: IsoDate } & At)
  // Reflections and prayer
  | ({ type: "reflection/save"; reflectionId: Id; answer: string } & At)
  | ({ type: "reflection/update"; reflectionId: Id; answer: string } & At)
  | ({ type: "prayer/markPrayed"; prayerId: Id } & At)
  // Quizzes
  | ({ type: "quiz/startAttempt"; quizId: Id; attemptId: Id } & At)
  | ({ type: "quiz/selectAnswer"; attemptId: Id; choiceId: Id } & At)
  | ({ type: "quiz/submitAnswer"; attemptId: Id; answerId: Id } & At)
  | ({ type: "quiz/nextQuestion"; attemptId: Id } & At)
  | ({ type: "quiz/completeAttempt"; attemptId: Id } & At)
  // Settings
  | ({ type: "settings/reminderEnabled"; reminderId: Id; enabled: boolean } & At)
  | ({ type: "settings/reminderTime"; reminderId: Id; time: LocalTime } & At)
  | ({ type: "settings/bibleTranslation"; translation: BibleTranslation } & At)
  | ({ type: "settings/textSize"; textSize: TextSize } & At)
  // Progress
  | ({ type: "progress/recordDayCompletion"; dayId: Id; today: IsoDate } & At)
  | ({ type: "progress/recordQuizCompletion"; attemptId: Id } & At)
  // Plan generation
  | ({ type: "generation/start"; generationId: Id; planId: Id } & At)
  | ({ type: "generation/step"; status: PlanGenerationStatus } & At)
  | ({ type: "generation/complete"; content: GeneratedPlanContent } & At)
  | ({ type: "generation/fail"; error: PlanGenerationError } & At)
  | ({ type: "generation/retry" } & At);
