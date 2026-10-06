import { getGenerationBar, type Build } from "@/features/plan-creation/logic/generation-bar";

const build = (overrides: Partial<Build> = {}): Build => ({
  id: "generation-1",
  planId: "plan-1",
  title: "Break free",
  status: "writingDays",
  progress: 48,
  lengthDays: 5,
  quickCheck: true,
  error: null,
  ...overrides,
});

describe("getGenerationBar", () => {
  it("shows nothing when nothing is building, ready, or failed", () => {
    expect(getGenerationBar([], [])).toBeNull();
  });

  it("shows a plan being built with its progress", () => {
    expect(getGenerationBar([build()], [])).toEqual({
      kind: "building",
      id: "generation-1",
      percent: 48,
      more: 0,
    });
  });

  it("shows a plan the moment it's asked for, before the server has it", () => {
    expect(
      getGenerationBar(
        [build({ status: "completed", progress: 100 })],
        [{ key: "start-1", failed: false }],
      ),
    ).toEqual({ kind: "building", id: null, percent: 0, more: 0 });
  });

  it("shows a plan that couldn't be started as failed, to try again", () => {
    expect(getGenerationBar([], [{ key: "start-1", failed: true }])).toEqual({
      kind: "failed",
      id: null,
      startKey: "start-1",
      reason: "We couldn’t start your plan. Check your connection and try again.",
      action: "retry",
    });
  });

  it("shows a finished plan as ready to open", () => {
    expect(getGenerationBar([build({ status: "completed", progress: 100 })], [])).toEqual({
      kind: "ready",
      id: "generation-1",
      planId: "plan-1",
      title: "Break free",
    });
  });

  it("offers another sermon when this one can never be built", () => {
    for (const code of ["noCaptions", "unsupportedSource"] as const) {
      const failed = build({
        status: "failed",
        error: {
          code,
          message: "This video doesn’t teach from the Bible enough to build a study.",
        },
      });
      expect(getGenerationBar([failed], [])).toMatchObject({
        kind: "failed",
        id: "generation-1",
        action: "chooseAnother",
      });
    }
  });

  it("offers to retry a build that failed for any other reason, with the server's reason", () => {
    const failed = build({
      status: "failed",
      error: {
        code: "unknown",
        message: "We couldn’t build this plan right now. Please try again.",
      },
    });
    expect(getGenerationBar([failed], [])).toEqual({
      kind: "failed",
      id: "generation-1",
      startKey: null,
      reason: "We couldn’t build this plan right now. Please try again.",
      action: "retry",
    });
  });

  it("shows the newest, and counts the others still building", () => {
    const view = getGenerationBar(
      [build({ id: "newest" }), build({ id: "older" }), build({ id: "done", status: "completed" })],
      [],
    );
    expect(view).toEqual({ kind: "building", id: "newest", percent: 48, more: 1 });
  });
});
