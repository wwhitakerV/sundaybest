import type { planGenerations } from "../db/schema.js";

export type BuildProgress = {
  status: typeof planGenerations.$inferSelect.status;
  lengthDays: number;
  quickCheckEnabled: boolean;
  daysWritten: number;
  quizzesWritten: number;
};

/** Where each stage starts, out of 100. Writing the days is most of the work; the quizzes the rest. */
const FETCHING_START = 5;
const SCRIPTURE_START = 15;
const DAYS_START = 25;
const QUIZZES_START = 70;
/** Short of 100 until the plan is saved: the bar fills only when it's ready to open. */
const WRITTEN = 95;

/**
 * How far along a build is, 0–100, for the app's progress bar: by stage, and
 * within writing by how many days and quizzes are done. It never goes back as
 * a build moves forward; a failed build has none.
 */
export function generationProgress(build: BuildProgress): number {
  const share = (done: number) => Math.min(1, done / Math.max(1, build.lengthDays));
  const daysEnd = build.quickCheckEnabled ? QUIZZES_START : WRITTEN;
  switch (build.status) {
    case "processingSermon":
      return FETCHING_START;
    case "findingScripture":
      return SCRIPTURE_START;
    case "writingDays":
      return Math.round(DAYS_START + (daysEnd - DAYS_START) * share(build.daysWritten));
    case "buildingQuiz":
      return Math.round(QUIZZES_START + (WRITTEN - QUIZZES_START) * share(build.quizzesWritten));
    case "completed":
      return 100;
    default:
      return 0;
  }
}
