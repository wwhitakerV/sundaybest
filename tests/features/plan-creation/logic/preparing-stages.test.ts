import {
  getPreparingPercent,
  getPreparingRows,
} from "@/features/plan-creation/logic/preparing-stages";

const states = (rows: ReturnType<typeof getPreparingRows>) => rows.map((row) => row.state);

describe("getPreparingRows", () => {
  it("lists the four stages, with the days counted and the quiz last", () => {
    expect(getPreparingRows("writingDays", 6, true).map((row) => row.label)).toEqual([
      "Listening to the message",
      "Finding the Scripture",
      "Writing your 6 days",
      "Building your quiz",
    ]);
  });

  it("leaves the quiz out of a plan without a Quick Check", () => {
    expect(getPreparingRows("writingDays", 1, false).map((row) => row.label)).toEqual([
      "Listening to the message",
      "Finding the Scripture",
      "Writing your 1 day",
    ]);
  });

  it("ticks off stages before the current one and spins on the current one", () => {
    expect(states(getPreparingRows("writingDays", 6, true))).toEqual([
      "done",
      "done",
      "active",
      "pending",
    ]);
  });

  it("has nothing started while the link is still being checked", () => {
    expect(states(getPreparingRows("validating", 6, true))).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("ticks everything once the plan is built", () => {
    expect(states(getPreparingRows("completed", 3, false))).toEqual(["done", "done", "done"]);
  });
});

describe("getPreparingPercent", () => {
  it("climbs with each stage, to 100 when built", () => {
    const stages = [
      "validating",
      "preparing",
      "processingSermon",
      "writingDays",
      "completed",
    ] as const;
    const percents = stages.map(getPreparingPercent);

    expect(percents).toEqual([...percents].sort((a, b) => a - b));
    expect(getPreparingPercent("completed")).toBe(100);
  });

  it("shows nothing for a failed build", () => {
    expect(getPreparingPercent("failed")).toBe(0);
  });
});
