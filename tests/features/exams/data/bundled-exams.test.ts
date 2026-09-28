import { THEOLOGY_EXAM_ID, getTheologyExam } from "@/features/exams/data/bundled-exams";

describe("getTheologyExam", () => {
  it("parses the bundled file successfully", () => {
    const result = getTheologyExam();

    expect(result.ok).toBe(true);
  });

  it("returns the bundled exam under THEOLOGY_EXAM_ID", () => {
    const result = getTheologyExam();
    if (!result.ok) throw new Error("expected the bundled exam to parse");

    expect(result.exam.summary.id).toBe(THEOLOGY_EXAM_ID);
  });
});
