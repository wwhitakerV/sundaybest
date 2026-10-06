import {
  PREVIEW_STATES,
  getNextPreviewIndex,
} from "@/features/plan-creation/dev/generation-preview";

describe("the generation preview (development only)", () => {
  it("walks every state the bar and its sheet can be in", () => {
    expect(PREVIEW_STATES.map((state) => state.label)).toEqual([
      "Listening 10%",
      "Scripture 35%",
      "Writing 62%",
      "Quiz 88%",
      "Ready",
      "Failed · retry",
      "Failed · new sermon",
    ]);
  });

  it("starts at the first state, steps through each, then turns off", () => {
    expect(getNextPreviewIndex(null)).toBe(0);
    expect(getNextPreviewIndex(0)).toBe(1);
    expect(getNextPreviewIndex(PREVIEW_STATES.length - 1)).toBeNull();
  });

  it("pairs each building state with the step it's on", () => {
    expect(PREVIEW_STATES.slice(0, 4).map((state) => state.subject.status)).toEqual([
      "processingSermon",
      "findingScripture",
      "writingDays",
      "buildingQuiz",
    ]);
  });
});
