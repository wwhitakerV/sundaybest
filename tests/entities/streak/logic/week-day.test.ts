import { describeWeekDay } from "@/entities/streak/logic/week-day";

describe("describeWeekDay", () => {
  it("says a studied day was studied", () => {
    expect(describeWeekDay("2026-09-21", "2026-09-22", true)).toBe("Mon, Sep 21: studied");
  });

  it("says today, not yet, until it's studied", () => {
    expect(describeWeekDay("2026-09-22", "2026-09-22", false)).toBe("Today, Sep 22: not yet");
  });

  it("says an earlier day wasn't studied, and a later one is ahead", () => {
    expect(describeWeekDay("2026-09-20", "2026-09-22", false)).toBe("Sun, Sep 20: not studied");
    expect(describeWeekDay("2026-09-25", "2026-09-22", false)).toBe("Fri, Sep 25: ahead");
  });
});
