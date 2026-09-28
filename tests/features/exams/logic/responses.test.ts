import type { ExamPair } from "@/types/domain";
import { pairTarget, toggleChoice, togglePlacedStep } from "@/features/exams/logic/responses";

describe("toggleChoice", () => {
  it("adds a choice that isn't selected yet", () => {
    expect(toggleChoice(["A"], "B")).toEqual(["A", "B"]);
  });

  it("removes a choice that is already selected", () => {
    expect(toggleChoice(["A", "B"], "A")).toEqual(["B"]);
  });

  it("does not mutate the array it was given", () => {
    const original = ["A"];

    toggleChoice(original, "B");

    expect(original).toEqual(["A"]);
  });
});

describe("togglePlacedStep (criterion 11)", () => {
  it("appends an unplaced step, taking the next number", () => {
    expect(togglePlacedStep(["S1", "S2"], "S3")).toEqual(["S1", "S2", "S3"]);
  });

  it("removes a placed step and moves later steps up", () => {
    expect(togglePlacedStep(["S1", "S2", "S3"], "S1")).toEqual(["S2", "S3"]);
  });

  it("does not mutate the array it was given", () => {
    const original = ["S1"];

    togglePlacedStep(original, "S2");

    expect(original).toEqual(["S1"]);
  });
});

describe("pairTarget (criterion 12)", () => {
  it("sets a prompt's target when it had none", () => {
    const result = pairTarget([], "P1", "R1");

    expect(result.pairs).toEqual([{ promptId: "P1", targetId: "R1" }]);
    expect(result.movedFrom).toBeNull();
  });

  it("replaces a prompt's previous target when picking a new, unused one", () => {
    const pairs: ExamPair[] = [{ promptId: "P1", targetId: "R1" }];

    const result = pairTarget(pairs, "P1", "R2");

    expect(result.pairs).toEqual([{ promptId: "P1", targetId: "R2" }]);
    expect(result.movedFrom).toBeNull();
  });

  it("moves a target from the prompt it was paired with, and reports movedFrom", () => {
    const pairs: ExamPair[] = [
      { promptId: "P1", targetId: "R1" },
      { promptId: "P2", targetId: "R2" },
    ];

    const result = pairTarget(pairs, "P2", "R1");

    expect(result.pairs).toEqual(expect.arrayContaining([{ promptId: "P2", targetId: "R1" }]));
    expect(result.pairs.find((pair) => pair.promptId === "P1")).toBeUndefined();
    expect(result.movedFrom).toBe("P1");
  });

  it("changes nothing when picking the target the prompt already has", () => {
    const pairs: ExamPair[] = [{ promptId: "P1", targetId: "R1" }];

    const result = pairTarget(pairs, "P1", "R1");

    expect(result.pairs).toEqual(pairs);
    expect(result.movedFrom).toBeNull();
  });

  it("never produces a target used twice", () => {
    const pairs: ExamPair[] = [
      { promptId: "P1", targetId: "R1" },
      { promptId: "P2", targetId: "R2" },
    ];

    const result = pairTarget(pairs, "P2", "R1");

    const targetIds = result.pairs.map((pair) => pair.targetId);
    expect(new Set(targetIds).size).toBe(targetIds.length);
  });
});
