import { getBundledExam } from "../data/bundled-exams";
import { SUBJECTS } from "../data/catalog";
import type { Exam, Subject } from "../types";
import { useExamRouteParams } from "./use-exam-route";

type SubjectExam = { exam: Subject["exams"][number]; summary: Exam["summary"] | null };

/**
 * The subject the route names — its place among them, and each of its
 * exams with its summary where it has content that can be taken — or null
 * if there's no such subject.
 */
export function useSubject(): { subject: Subject; index: number; exams: SubjectExam[] } | null {
  const { subjectId } = useExamRouteParams();
  const subject = SUBJECTS.find(({ id }) => id === subjectId);
  if (!subject) return null;
  return {
    subject,
    index: SUBJECTS.indexOf(subject),
    exams: subject.exams.map((exam) => {
      const parsed = getBundledExam(exam.examId);
      return { exam, summary: parsed?.ok ? parsed.exam.summary : null };
    }),
  };
}
