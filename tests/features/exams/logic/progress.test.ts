import { describeContinue, getNextExam } from "@/features/exams/logic/progress";

describe("describeContinue", () => {
  it("names an exam under way, and how far through it is", () => {
    expect(
      describeContinue({ mode: "exam", done: 6, total: 15 }, "The Scriptures Received"),
    ).toEqual({ label: "Continue exam · The Scriptures Received", detail: "6 of 15 answered" });
  });

  it("names a study under way by what's been checked", () => {
    expect(
      describeContinue({ mode: "study", done: 2, total: 15 }, "The Scriptures Received"),
    ).toEqual({ label: "Continue study · The Scriptures Received", detail: "2 of 15 checked" });
  });
});

describe("getNextExam", () => {
  const open = { available: true, state: "notStarted" } as const;

  it("marks the first exam that can be taken and hasn't been finished as where to start", () => {
    expect(getNextExam([{ available: true, state: "completed" }, open, { ...open }])).toEqual({
      index: 1,
      label: "Start here",
    });
  });

  it("marks one under way as where to continue", () => {
    expect(getNextExam([{ available: true, state: "inProgress" }, open])).toEqual({
      index: 0,
      label: "Continue",
    });
  });

  it("passes over an exam not yet written", () => {
    expect(getNextExam([{ available: false, state: "notStarted" }, open])).toEqual({
      index: 1,
      label: "Start here",
    });
  });

  it("marks nothing once every exam that can be taken is finished", () => {
    expect(
      getNextExam([
        { available: true, state: "completed" },
        { available: false, state: "notStarted" },
      ]),
    ).toBeNull();
  });
});
