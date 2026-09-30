import theologyExamContent from "./content/THEO-01-01.json";
import { parseExamContent, type ParsedExam } from "./parse-exam";

/**
 * The exams bundled with the app — one for now. A second is its JSON file
 * beside this one and a line here (ADR 0013).
 */
export const THEOLOGY_EXAM_ID = "THEO-01-01";

let theologyExam: ParsedExam | null = null;

/** The bundled THEO-01-01, parsed once and failing closed. */
export function getTheologyExam(): ParsedExam {
  theologyExam ??= parseExamContent(theologyExamContent);
  return theologyExam;
}

/** Every exam bundled with the app, parsed — each failing closed on its own. */
export function listBundledExams(): ParsedExam[] {
  return [getTheologyExam()];
}

/** A bundled exam by its ID, parsed, or null when there's none by that ID. */
export function getBundledExam(examId: string): ParsedExam | null {
  return (
    listBundledExams().find((parsed) =>
      parsed.ok ? parsed.exam.summary.id === examId : parsed.examId === examId,
    ) ?? null
  );
}
