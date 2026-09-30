import type { ExamMode } from "@/types/domain";

/** What beginning an exam in a mode does, and how its button's labelled. */
export type ExamAction = {
  kind: "beginExam" | "beginPractice" | "resumeExam" | "beginStudy" | "continueStudy";
  label: string;
};

/** Where the learner stands with an exam. */
export type ExamStanding = {
  state: "notStarted" | "inProgress" | "completed" | "studyExposed";
  /** A line on where they are — how far through, or the last score — or null on a first visit. */
  status: string | null;
};

/** What the learner has done with an exam so far. */
export type ExamHistory = {
  openExam: { answered: number; total: number } | null;
  openStudy: { checked: number } | null;
  latestExam: { correct: number; total: number; band: string | null; practice: boolean } | null;
  revealed: boolean;
};

/**
 * Where the learner stands: an exam under way and how far through, the last
 * score once one's submitted, how far study has gone once it's shown
 * answers — or nothing yet, on a first visit.
 */
export function describeExamStanding({
  openExam,
  openStudy,
  latestExam,
  revealed,
}: ExamHistory): ExamStanding {
  if (openExam) {
    return {
      state: "inProgress",
      status: `In progress · ${openExam.answered} of ${openExam.total} answered`,
    };
  }
  if (latestExam) {
    const parts = [
      `Last score · ${latestExam.correct} of ${latestExam.total}`,
      latestExam.band,
      latestExam.practice ? "Practice" : null,
    ].filter((part) => part !== null);
    return { state: "completed", status: parts.join(" · ") };
  }
  if (revealed) {
    return {
      state: "studyExposed",
      status: openStudy ? `Studying · ${openStudy.checked} checked` : null,
    };
  }
  return { state: "notStarted", status: null };
}

/**
 * What beginning the mode chosen does. Exam resumes one left unfinished;
 * once one's submitted, or Study has shown answers, a new one is Practice.
 * Study continues one already begun — an unfinished exam never holds it up.
 */
export function describeBeginAction(
  { openExam, openStudy, latestExam, revealed }: ExamHistory,
  mode: ExamMode,
): ExamAction {
  if (mode === "study") {
    return openStudy
      ? { kind: "continueStudy", label: "Continue study" }
      : { kind: "beginStudy", label: "Begin study" };
  }
  if (openExam) return { kind: "resumeExam", label: "Resume exam" };
  if (latestExam) return { kind: "beginPractice", label: "Practice again" };
  if (revealed) return { kind: "beginPractice", label: "Begin practice exam" };
  return { kind: "beginExam", label: "Begin exam" };
}

/**
 * The mode chosen when the overview opens: Study — learning as you go,
 * the gentler way in — unless an exam's under way, which is picked up
 * where it was left.
 */
export function getStartingMode({ openExam }: ExamHistory): ExamMode {
  return openExam ? "exam" : "study";
}
