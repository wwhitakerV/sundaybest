import type {
  ApiQuiz,
  ApiQuizAnswerFeedback,
  ApiQuizScore,
  ApiStudyDay,
} from "@/core/api/contracts";
import type { Id } from "@/types/domain";

/** Study content shaped exactly for the existing UI, sourced from the API. */
export type StudyReflection = ApiStudyDay["reflectionPrompts"][number];
export type StudyPrayer = ApiStudyDay["prayer"];
export type StudyScripture = ApiStudyDay["scripture"];
export type StudyReading = ApiStudyDay["reading"];

export type StudyDayContent = {
  day: Pick<ApiStudyDay, "id" | "planId" | "dayNumber" | "reading" | "progress">;
  scripture: StudyScripture;
  reflections: StudyReflection[];
  prayer: StudyPrayer;
};

export type QuestionResult = "unanswered" | "correct" | "incorrect";
export type QuizStatus = "notStarted" | "inProgress" | "completed";

/**
 * Public questions do not contain answer keys. Once a question is answered,
 * its server-returned feedback is merged into this view shape for rendering.
 */
export type QuickCheckQuestionView = ApiQuiz["questions"][number] & {
  correctChoiceId: Id | null;
  explanation: string | null;
};

export type QuickCheckAnswerView = ApiQuizAnswerFeedback;
export type QuickCheckScoreView = ApiQuizScore;
