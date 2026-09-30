import type { ExamLevel, Subject } from "../types";

/**
 * The subjects of study the exams page shows, each with its four exams.
 *
 * PLACEHOLDER CATALOG — replace with the real curriculum. Only subject 01's
 * titles and subject 02's name are real (from the exams-page mock); every
 * "Subject NN" and "Exam title" below stands in for one still to be named,
 * and only THEO-01-01 has content that can be taken (`bundled-exams.ts`).
 * An exam without content opens an overview that says it isn't available
 * yet. Do not write theological content here — titles come from the
 * curriculum, not the app.
 */

const LEVELS: readonly ExamLevel[] = ["foundations", "intermediate", "advanced", "scholar"];

/** A subject still to be named, its four exams too. */
function placeholder(
  number: number,
  title = `Subject ${String(number).padStart(2, "0")}`,
): Subject {
  const id = `THEO-${String(number).padStart(2, "0")}`;
  return {
    id,
    title,
    exams: LEVELS.map((level, index) => ({
      examId: `${id}-${String(index + 1).padStart(2, "0")}`,
      level,
      title: "Exam title",
    })),
  };
}

export const SUBJECTS: readonly Subject[] = [
  {
    id: "THEO-01",
    title: "Scripture & Reading",
    exams: [
      { examId: "THEO-01-01", level: "foundations", title: "The Scriptures Received" },
      { examId: "THEO-01-02", level: "intermediate", title: "Reading in Context" },
      { examId: "THEO-01-03", level: "advanced", title: "Interpreting Difficult Texts" },
      { examId: "THEO-01-04", level: "scholar", title: "Canon, Interpretation & Authority" },
    ],
  },
  placeholder(2, "The Biblical Story"),
  ...Array.from({ length: 10 }, (_, index) => placeholder(index + 3)),
];
