import {
  QUICK_CHECK_STAGES,
  getNextQuickCheckAction,
} from "@/features/plans/logic/quick-check-stages";

describe("quick check stages", () => {
  it("runs question, answer, finish-verse, then score", () => {
    expect(QUICK_CHECK_STAGES.map((stage) => stage.key)).toEqual([
      "question",
      "answer",
      "finish-verse",
      "score",
    ]);
  });

  it("advances to the next stage before the score", () => {
    expect(getNextQuickCheckAction(1)).toEqual({ type: "stage", stage: 2 });
  });

  it("finishes from the score stage", () => {
    expect(getNextQuickCheckAction(3)).toEqual({ type: "done" });
  });
});
