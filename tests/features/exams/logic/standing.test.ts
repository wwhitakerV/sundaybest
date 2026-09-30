import {
  describeBeginAction,
  describeExamStanding,
  getStartingMode,
} from "@/features/exams/logic/standing";

const NONE = { openExam: null, openStudy: null, latestExam: null, revealed: false };
const SUBMITTED = {
  ...NONE,
  latestExam: { correct: 12, total: 15, band: "Strong", practice: false },
  revealed: true,
};

describe("describeExamStanding", () => {
  it("has nothing to report on a first visit", () => {
    const standing = describeExamStanding(NONE);

    expect(standing.state).toBe("notStarted");
    expect(standing.status).toBeNull();
  });

  it("says how far through an unfinished exam is", () => {
    const standing = describeExamStanding({ ...NONE, openExam: { answered: 6, total: 15 } });

    expect(standing.state).toBe("inProgress");
    expect(standing.status).toBe("In progress · 6 of 15 answered");
  });

  it("gives the last score and its band once one's submitted", () => {
    const standing = describeExamStanding(SUBMITTED);

    expect(standing.state).toBe("completed");
    expect(standing.status).toBe("Last score · 12 of 15 · Strong");
  });

  it("marks a Practice score as Practice", () => {
    expect(
      describeExamStanding({
        ...NONE,
        latestExam: { correct: 14, total: 15, band: "Mastered", practice: true },
        revealed: true,
      }).status,
    ).toBe("Last score · 14 of 15 · Mastered · Practice");
  });

  it("says how far study has gone once it's shown answers", () => {
    const standing = describeExamStanding({ ...NONE, openStudy: { checked: 1 }, revealed: true });

    expect(standing.state).toBe("studyExposed");
    expect(standing.status).toBe("Studying · 1 checked");
  });
});

describe("describeBeginAction", () => {
  describe("Exam, chosen", () => {
    it("begins an exam on a first visit", () => {
      expect(describeBeginAction(NONE, "exam")).toEqual({ kind: "beginExam", label: "Begin exam" });
    });

    it("resumes one left unfinished", () => {
      expect(
        describeBeginAction({ ...NONE, openExam: { answered: 6, total: 15 } }, "exam"),
      ).toEqual({ kind: "resumeExam", label: "Resume exam" });
    });

    it("practises again after one's submitted", () => {
      expect(describeBeginAction(SUBMITTED, "exam")).toEqual({
        kind: "beginPractice",
        label: "Practice again",
      });
    });

    it("begins a practice exam once Study has shown answers", () => {
      expect(
        describeBeginAction({ ...NONE, openStudy: { checked: 1 }, revealed: true }, "exam"),
      ).toEqual({ kind: "beginPractice", label: "Begin practice exam" });
    });
  });

  describe("Study, chosen", () => {
    it("begins study when none is open", () => {
      expect(describeBeginAction(SUBMITTED, "study")).toEqual({
        kind: "beginStudy",
        label: "Begin study",
      });
    });

    it("continues a study already begun", () => {
      expect(describeBeginAction({ ...NONE, openStudy: { checked: 0 } }, "study")).toEqual({
        kind: "continueStudy",
        label: "Continue study",
      });
    });

    it("never waits on an unfinished exam", () => {
      expect(
        describeBeginAction({ ...NONE, openExam: { answered: 6, total: 15 } }, "study").kind,
      ).toBe("beginStudy");
    });
  });
});

describe("getStartingMode", () => {
  it("starts on Study", () => {
    expect(getStartingMode(NONE)).toBe("study");
    expect(getStartingMode(SUBMITTED)).toBe("study");
  });

  it("starts on an unfinished exam, even beside an open study", () => {
    expect(
      getStartingMode({ ...NONE, openExam: { answered: 1, total: 15 }, openStudy: { checked: 0 } }),
    ).toBe("exam");
  });

  it("starts on Study when a study's open and no exam is", () => {
    expect(getStartingMode({ ...NONE, openStudy: { checked: 2 } })).toBe("study");
  });
});
