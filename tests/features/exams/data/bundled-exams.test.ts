import {
  THEOLOGY_EXAM_ID,
  getBundledExam,
  getTheologyExam,
  listBundledExams,
} from "@/features/exams/data/bundled-exams";

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

describe("listBundledExams", () => {
  it("lists every exam bundled with the app — one for now", () => {
    expect(listBundledExams().map((parsed) => (parsed.ok ? parsed.exam.summary.id : null))).toEqual(
      [THEOLOGY_EXAM_ID],
    );
  });
});

describe("getBundledExam", () => {
  it("finds a bundled exam by its ID", () => {
    const parsed = getBundledExam(THEOLOGY_EXAM_ID);

    expect(parsed?.ok && parsed.exam.summary.title).toBe("The Scriptures Received");
  });

  it("finds nothing for an exam that isn't bundled", () => {
    expect(getBundledExam("THEO-99-99")).toBeNull();
  });
});
