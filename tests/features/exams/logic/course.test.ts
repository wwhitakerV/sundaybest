import {
  buildSyllabus,
  describePreface,
  describeReview,
  findNextExam,
  formatObjective,
  formatReviewDue,
  getReviewQuestions,
} from "@/features/exams/logic/course";
import type { Subject } from "@/features/exams/types";

const SUBJECTS: Subject[] = [
  {
    id: "S1",
    title: "One",
    exams: [
      { examId: "S1-1", level: "foundations", title: "First" },
      { examId: "S1-2", level: "intermediate", title: "Second" },
    ],
  },
  { id: "S2", title: "Two", exams: [{ examId: "S2-1", level: "foundations", title: "Third" }] },
];

describe("findNextExam", () => {
  it("finds the next level up in the same subject", () => {
    expect(findNextExam(SUBJECTS, "S1-1")).toEqual({
      examId: "S1-2",
      level: "intermediate",
      title: "Second",
    });
  });

  it("finds nothing after a subject's last exam, nor for one it doesn't have", () => {
    expect(findNextExam(SUBJECTS, "S1-2")).toBeNull();
    expect(findNextExam(SUBJECTS, "NOPE")).toBeNull();
  });
});

describe("getReviewQuestions", () => {
  const questions = [
    { id: "Q1", primaryConceptId: "a" },
    { id: "Q2", primaryConceptId: "b" },
    { id: "Q3", primaryConceptId: "a" },
  ];

  it("keeps the questions on the concepts to review, in order", () => {
    expect(getReviewQuestions(questions, ["a"]).map(({ id }) => id)).toEqual(["Q1", "Q3"]);
  });

  it("keeps none when there's nothing to review", () => {
    expect(getReviewQuestions(questions, [])).toEqual([]);
  });
});

describe("describeReview", () => {
  it("offers to review the concepts missed", () => {
    expect(describeReview(2, false)).toBe("Review 2 concepts");
    expect(describeReview(1, false)).toBe("Review 1 concept");
  });

  it("offers nothing with nothing to review, or while a study is already open", () => {
    expect(describeReview(0, false)).toBeNull();
    expect(describeReview(2, true)).toBeNull();
  });
});

describe("formatObjective", () => {
  it("sets an objective as a sentence", () => {
    expect(formatObjective("identify major divisions")).toBe("Identify major divisions");
  });
});

describe("buildSyllabus", () => {
  const link = (reference: string) => ({ reference, url: `https://example.test/${reference}` });

  it("gathers each available exam's objectives, under its level and title", () => {
    const syllabus = buildSyllabus([
      {
        exam: { examId: "S1-1", level: "foundations", title: "First" },
        summary: { objectives: ["locate a claim"], sourceLinks: [link("Luke 24")] },
      },
      { exam: { examId: "S1-2", level: "intermediate", title: "Second" }, summary: null },
    ]);

    expect(syllabus.objectives).toEqual([
      { examId: "S1-1", level: "Foundations", title: "First", items: ["Locate a claim"] },
    ]);
  });

  it("lists every passage to read once, in the order they first come", () => {
    const syllabus = buildSyllabus([
      {
        exam: { examId: "S1-1", level: "foundations", title: "First" },
        summary: { objectives: [], sourceLinks: [link("Luke 24"), link("Acts 17")] },
      },
      {
        exam: { examId: "S1-2", level: "intermediate", title: "Second" },
        summary: { objectives: [], sourceLinks: [link("Acts 17"), link("John 5")] },
      },
    ]);

    expect(syllabus.readings.map(({ reference }) => reference)).toEqual([
      "Luke 24",
      "Acts 17",
      "John 5",
    ]);
  });
});

describe("describePreface", () => {
  it("sets out an exam's conditions before it's begun", () => {
    expect(describePreface({ mode: "exam", count: 15, duration: [8, 12] })).toEqual({
      start: "Start the exam",
      lines: [
        "15 questions",
        "About 8–12 min",
        "Answers are revealed after you submit",
        "You can leave and resume where you were",
      ],
    });
  });

  it("sets out a study's, leaving out the time for a shorter review", () => {
    expect(describePreface({ mode: "study", count: 3, duration: null })).toEqual({
      start: "Start studying",
      lines: [
        "3 questions",
        "Check each answer as you go, and see why",
        "You can leave and resume where you were",
      ],
    });
  });
});

describe("formatReviewDue", () => {
  it("says how many concepts wait for review", () => {
    expect(formatReviewDue(1)).toBe("Review due · 1 concept");
    expect(formatReviewDue(3)).toBe("Review due · 3 concepts");
  });

  it("says nothing with none waiting", () => {
    expect(formatReviewDue(0)).toBeNull();
  });
});
