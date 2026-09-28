import { THEOLOGY_EXAM_ID } from "@/features/exams/data/bundled-exams";
import {
  checkAnswer,
  getConceptTitle,
  getQuestionReveal,
  gradeAttempt,
} from "@/features/exams/data/exam-grading";
import { anExamAttempt } from "@tests/factories/exam-attempts";

const Q01 = "THEO-01-01-Q01";

describe("getQuestionReveal", () => {
  it("returns the reveal for a known question in the bundled exam", () => {
    const reveal = getQuestionReveal(THEOLOGY_EXAM_ID, Q01);

    expect(reveal?.questionId).toBe(Q01);
  });

  it("returns null for an unknown exam id", () => {
    expect(getQuestionReveal("NOT-AN-EXAM", Q01)).toBeNull();
  });

  it("returns null for an unknown question id", () => {
    expect(getQuestionReveal(THEOLOGY_EXAM_ID, "NOT-A-QUESTION")).toBeNull();
  });
});

describe("checkAnswer", () => {
  it("returns true for Q01 answered D", () => {
    expect(checkAnswer(THEOLOGY_EXAM_ID, Q01, { kind: "single_choice", choiceId: "D" })).toBe(true);
  });

  it("returns false for Q01 answered A", () => {
    expect(checkAnswer(THEOLOGY_EXAM_ID, Q01, { kind: "single_choice", choiceId: "A" })).toBe(
      false,
    );
  });

  it("returns null for an unknown exam id", () => {
    expect(checkAnswer("NOT-AN-EXAM", Q01, { kind: "single_choice", choiceId: "D" })).toBeNull();
  });

  it("returns null for an unknown question id", () => {
    expect(
      checkAnswer(THEOLOGY_EXAM_ID, "NOT-A-QUESTION", { kind: "single_choice", choiceId: "D" }),
    ).toBeNull();
  });
});

describe("gradeAttempt", () => {
  it("returns null for an attempt at an exam that isn't bundled", () => {
    expect(gradeAttempt(anExamAttempt({ examId: "NOT-AN-EXAM" }))).toBeNull();
  });
});

describe("getConceptTitle", () => {
  it("names a concept by the teaching title of a question that observes it", () => {
    expect(getConceptTitle(THEOLOGY_EXAM_ID, "berean_examination")).toBe("Berean Examination");
  });

  it("falls back to the concept id for a concept no question observes", () => {
    expect(getConceptTitle(THEOLOGY_EXAM_ID, "not_a_concept")).toBe("not_a_concept");
  });

  it("falls back to the concept id for an exam that isn't bundled", () => {
    expect(getConceptTitle("NOT-AN-EXAM", "berean_examination")).toBe("berean_examination");
  });
});
