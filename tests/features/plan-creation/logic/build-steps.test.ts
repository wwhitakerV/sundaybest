import { getBuildSteps } from "@/features/plan-creation/logic/build-steps";

const states = (rows: ReturnType<typeof getBuildSteps>) => rows.map((row) => row.state);

describe("getBuildSteps", () => {
  it("lists the four stages, with the days counted and the quiz last", () => {
    expect(getBuildSteps("writingDays", 6, true).map((row) => row.label)).toEqual([
      "Listening to the message",
      "Finding the Scripture",
      "Writing your 6 days",
      "Building your quiz",
    ]);
  });

  it("leaves the quiz out of a plan without a Quick Check", () => {
    expect(getBuildSteps("writingDays", 1, false).map((row) => row.label)).toEqual([
      "Listening to the message",
      "Finding the Scripture",
      "Writing your 1 day",
    ]);
  });

  it("ticks off stages before the current one and spins on the current one", () => {
    expect(states(getBuildSteps("writingDays", 6, true))).toEqual([
      "done",
      "done",
      "active",
      "pending",
    ]);
  });

  it("is on the first step as soon as the plan is asked for", () => {
    for (const status of ["validating", "preparing"] as const) {
      expect(states(getBuildSteps(status, 6, true))).toEqual([
        "active",
        "pending",
        "pending",
        "pending",
      ]);
    }
  });

  it("ticks everything once the plan is built", () => {
    expect(states(getBuildSteps("completed", 3, false))).toEqual(["done", "done", "done"]);
  });
});
