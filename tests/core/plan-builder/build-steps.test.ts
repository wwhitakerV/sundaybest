import { MOCK_TEST_LINKS } from "@/core/plan-builder";
import { getMockBuildFailure } from "@/core/plan-builder/build-outcome";
import { getNextBuildMove } from "@/core/plan-builder/build-steps";
import type { PlanGeneration, PlanGenerationStatus } from "@/types/domain";

const generation = (
  status: PlanGenerationStatus,
  sourceUrl = "https://youtube.com/watch?v=abc123",
  attempt = 1,
): PlanGeneration => ({
  id: "generation",
  createdAt: "2026-09-23T12:00:00.000Z",
  updatedAt: "2026-09-23T12:00:00.000Z",
  userId: "user",
  sourceUrl,
  lengthDays: 3,
  quickCheckEnabled: true,
  status,
  attempt,
  sermonId: "sermon",
  planId: "plan",
  startedAt: "2026-09-23T12:00:00.000Z",
  finishedAt: null,
  error: null,
});

describe("getNextBuildMove", () => {
  it("moves through the stages in order", () => {
    expect(getNextBuildMove(generation("validating"), true)).toEqual({
      type: "step",
      status: "preparing",
    });
    expect(getNextBuildMove(generation("writingDays"), true)).toEqual({
      type: "step",
      status: "buildingQuiz",
    });
  });

  it("skips the quiz for a plan without a Quick Check", () => {
    expect(getNextBuildMove(generation("writingDays"), false)).toEqual({ type: "complete" });
  });

  it("finishes after the last stage", () => {
    expect(getNextBuildMove(generation("buildingQuiz"), true)).toEqual({ type: "complete" });
  });

  it("does nothing for a build that isn't running", () => {
    expect(getNextBuildMove(generation("completed"), true)).toBeNull();
    expect(getNextBuildMove(generation("failed"), true)).toBeNull();
  });

  it("fails a link with no captions while listening to the message", () => {
    const move = getNextBuildMove(generation("processingSermon", MOCK_TEST_LINKS.noCaptions), true);

    expect(move).toMatchObject({ type: "fail", error: { code: "noCaptions" } });
  });
});

describe("getMockBuildFailure", () => {
  it("never fails an ordinary link", () => {
    expect(getMockBuildFailure("https://youtube.com/watch?v=abc123", 1)).toBeNull();
  });

  it("fails the always-failing link on every attempt", () => {
    expect(getMockBuildFailure(MOCK_TEST_LINKS.buildFails, 1)?.at).toBe("writingDays");
    expect(getMockBuildFailure(MOCK_TEST_LINKS.buildFails, 3)?.at).toBe("writingDays");
  });

  it("fails the fails-once link only on its first attempt", () => {
    expect(getMockBuildFailure(MOCK_TEST_LINKS.failsOnce, 1)?.error.code).toBe("network");
    expect(getMockBuildFailure(MOCK_TEST_LINKS.failsOnce, 2)).toBeNull();
  });
});
