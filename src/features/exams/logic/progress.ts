import type { ExamMode } from "@/types/domain";
import type { ExamStanding } from "./standing";

/**
 * The exams page's way back into an attempt under way: what it is, and how
 * far through — answered in an exam, checked in a study.
 */
export function describeContinue(
  { mode, done, total }: { mode: ExamMode; done: number; total: number },
  title: string,
): { label: string; detail: string } {
  return {
    label: `Continue ${mode} · ${title}`,
    detail: `${done} of ${total} ${mode === "study" ? "checked" : "answered"}`,
  };
}

/**
 * Where a subject's learner goes next: the first exam that can be taken and
 * isn't finished — to continue, if it's under way; to start, if not — or
 * null once every one that can be taken is done.
 */
export function getNextExam(
  exams: readonly { available: boolean; state: ExamStanding["state"] }[],
): { index: number; label: "Start here" | "Continue" } | null {
  const index = exams.findIndex(({ available, state }) => available && state !== "completed");
  const next = exams.at(index);
  if (index < 0 || !next) return null;
  return { index, label: next.state === "inProgress" ? "Continue" : "Start here" };
}
