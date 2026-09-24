import {
  STUDY_STEPS,
  STUDY_STEP_COUNT,
  fromPageIndex,
  getNextStudyAction,
  getPreviousStudyAction,
  getStudyPages,
  isLastStudyPage,
  toPageIndex,
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

// A day with two reflection questions: Read, Scripture, two Reflect pages, Pray.
const PAGES = getStudyPages(2);

describe("getStudyPages", () => {
  it("gives Reflect a page per question, and every other step one", () => {
    expect(getStudyPages(2)).toEqual([1, 1, 2, 1]);
  });

  it("keeps a page for Reflect with no questions", () => {
    expect(getStudyPages(0)).toEqual([1, 1, 1, 1]);
  });
});

describe("isLastStudyPage", () => {
  it("is true only on Pray's last page", () => {
    expect(isLastStudyPage({ step: 3, page: 0 }, PAGES)).toBe(true);
    expect(isLastStudyPage({ step: 2, page: 1 }, PAGES)).toBe(false);
  });
});

describe("getNextStudyAction", () => {
  it("turns to the next page within a step", () => {
    expect(getNextStudyAction({ step: 2, page: 0 }, PAGES)).toEqual({
      type: "move",
      to: { step: 2, page: 1 },
    });
  });

  it("moves to the next step's first page from a step's last", () => {
    expect(getNextStudyAction({ step: 2, page: 1 }, PAGES)).toEqual({
      type: "move",
      to: { step: 3, page: 0 },
    });
  });

  it("finishes the day from the last page of the last step", () => {
    expect(getNextStudyAction({ step: 3, page: 0 }, PAGES)).toEqual({ type: "finish" });
  });
});

describe("getPreviousStudyAction", () => {
  it("exits the flow from the very first page", () => {
    expect(getPreviousStudyAction({ step: 0, page: 0 }, PAGES)).toEqual({ type: "exit" });
  });

  it("turns back a page within a step", () => {
    expect(getPreviousStudyAction({ step: 2, page: 1 }, PAGES)).toEqual({
      type: "move",
      to: { step: 2, page: 0 },
    });
  });

  it("moves back to the previous step's last page", () => {
    expect(getPreviousStudyAction({ step: 3, page: 0 }, PAGES)).toEqual({
      type: "move",
      to: { step: 2, page: 1 },
    });
  });
});

describe("page indexes", () => {
  it("counts every page before a position, across steps", () => {
    expect(toPageIndex({ step: 3, page: 0 }, PAGES)).toBe(4);
  });

  it("turns a page index back into its step and page", () => {
    expect(fromPageIndex(3, PAGES)).toEqual({ step: 2, page: 1 });
  });

  it("clamps an index past the end to the last page", () => {
    expect(fromPageIndex(9, PAGES)).toEqual({ step: 3, page: 0 });
  });
});
