import { getStreakLabel } from "@/features/fun/logic/streak-label";

describe("getStreakLabel", () => {
  it("counts a streak under way in days", () => {
    expect(getStreakLabel(12)).toBe("12 day streak");
  });

  it("invites a streak when none is going", () => {
    expect(getStreakLabel(0)).toBe("Start a streak");
  });
});
