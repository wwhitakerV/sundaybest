import {
  STUDY_STEPS,
  STUDY_STEP_COUNT,
  getNextStudyAction,
  getPreviousStudyAction,
  isLastStudyStep,
} from "@/features/plans/logic/study-steps";

describe("STUDY_STEPS", () => {
  it("runs Read, Scripture, Reflect, Pray in that order", () => {
    expect(STUDY_STEPS.map((step) => step.label)).toEqual(["Read", "Scripture", "Reflect", "Pray"]);
  });

  it("anchors the first two labels left and the last two right", () => {
    expect(STUDY_STEPS.map((step) => step.labelAlign)).toEqual(["left", "left", "right", "right"]);
  });

  it("counts four steps", () => {
    expect(STUDY_STEP_COUNT).toBe(4);
  });
});

describe("isLastStudyStep", () => {
  it("is true only for Pray", () => {
    expect([0, 1, 2, 3].map(isLastStudyStep)).toEqual([false, false, false, true]);
  });
});

describe("getPreviousStudyAction", () => {
  it("exits the flow from the first step", () => {
    expect(getPreviousStudyAction(0)).toEqual({ type: "exit" });
  });

  it("steps back from any later step", () => {
    expect(getPreviousStudyAction(2)).toEqual({ type: "step", step: 1 });
  });
});

describe("getNextStudyAction", () => {
  it("steps forward before the last step", () => {
    expect(getNextStudyAction(0)).toEqual({ type: "step", step: 1 });
  });

  it("finishes the day from the last step", () => {
    expect(getNextStudyAction(3)).toEqual({ type: "finish" });
  });
});
