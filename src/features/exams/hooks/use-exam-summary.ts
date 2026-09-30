import { getBundledExam } from "../data/bundled-exams";
import type { Exam } from "../types";
import { useExamRouteParams } from "./use-exam-route";

/** The exam the route names, as its overview shows it — or null if it isn't bundled, or failed its checks. */
export function useExamSummary(): Exam["summary"] | null {
  const { examId } = useExamRouteParams();
  const parsed = examId ? getBundledExam(examId) : null;
  return parsed?.ok ? parsed.exam.summary : null;
}
