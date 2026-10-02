import type {
  BibleTranslation,
  ExamAttemptItem,
  ExamMode,
  ExamResponse,
  ExamResult,
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
  ReadingPaper,
  Reflection,
  ScripturePassage,
  SermonSource,
  StudyStep,
  TextSize,
} from "@/types/domain";

/** One change to a reflection's answer: a first answer, a change to one, or one taken back. */
export type ReflectionWrite =
  | { kind: "save" | "update"; reflectionId: Id; answer: string }
  | { kind: "clear"; reflectionId: Id };

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
    | "church"
    | "thumbnailUrl"
    | "thumbnailColors"
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
  // A plan made and its build started, in one step.
  | ({
      type: "plan/createAndBuild";
      planId: Id;
      sermonId: Id;
      generationId: Id;
      sourceUrl: string;
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
  // The day finished from the study: its prayer prayed, then the day complete, in one step.
  | ({ type: "planDay/finish"; dayId: Id; prayerId: Id | null; today: IsoDate } & At)
  // Reflections and prayer
  | ({ type: "reflection/save"; reflectionId: Id; answer: string } & At)
  | ({ type: "reflection/update"; reflectionId: Id; answer: string } & At)
  | ({ type: "reflection/clear"; reflectionId: Id } & At)
  | ({ type: "prayer/markPrayed"; prayerId: Id } & At)
  // Everything typed this visit, written at once.
  | ({ type: "reflection/commit"; writes: readonly ReflectionWrite[] } & At)
  // Quizzes
  | ({ type: "quiz/startAttempt"; quizId: Id; attemptId: Id } & At)
  | ({ type: "quiz/selectAnswer"; attemptId: Id; choiceId: Id } & At)
  | ({ type: "quiz/submitAnswer"; attemptId: Id; answerId: Id } & At)
  | ({ type: "quiz/nextQuestion"; attemptId: Id } & At)
  | ({ type: "quiz/completeAttempt"; attemptId: Id } & At)
  // Theology exams
  | ({
      type: "exam/startAttempt";
      attemptId: Id;
      examId: string;
      examVersion: number;
      mode: ExamMode;
      /** The exam's questions as this attempt takes them — never their keys. */
      items: ExamAttemptItem[];
    } & At)
  | ({ type: "exam/recordResponse"; attemptId: Id; questionId: Id; response: ExamResponse } & At)
  | ({ type: "exam/checkResponse"; attemptId: Id; questionId: Id; correct: boolean } & At)
  | ({ type: "exam/completeAttempt"; attemptId: Id; result: ExamResult } & At)
  // Settings
  | ({ type: "settings/reminderEnabled"; reminderId: Id; enabled: boolean } & At)
  | ({ type: "settings/reminderTime"; reminderId: Id; time: LocalTime } & At)
  // The reminder turned on at a time, in one step.
  | ({ type: "settings/reminderOn"; reminderId: Id; time: LocalTime } & At)
  | ({ type: "settings/bibleTranslation"; translation: BibleTranslation } & At)
  | ({ type: "settings/textSize"; textSize: TextSize } & At)
  | ({ type: "settings/readingTextOffset"; offset: number } & At)
  | ({ type: "settings/readingPaper"; paper: ReadingPaper } & At)
  // Progress
  | ({ type: "progress/recordDayCompletion"; dayId: Id; today: IsoDate } & At)
  | ({ type: "progress/recordQuizCompletion"; attemptId: Id } & At)
  // Plan generation
  | ({ type: "generation/start"; generationId: Id; planId: Id } & At)
  | ({ type: "generation/step"; status: PlanGenerationStatus } & At)
  | ({ type: "generation/complete"; content: GeneratedPlanContent } & At)
  | ({ type: "generation/fail"; error: PlanGenerationError } & At)
  | ({ type: "generation/retry" } & At);
