import { describeStreak, describeUpNextTime } from "@/features/plans/logic/day-complete";

describe("describeStreak", () => {
  it("is null with no streak", () => {
    expect(describeStreak(0)).toBeNull();
  });

  it("spells a streak of one", () => {
    expect(describeStreak(1)).toBe("One day streak");
  });

  it("spells a streak of two", () => {
    expect(describeStreak(2)).toBe("Two day streak");
  });

  it("spells a streak of six", () => {
    expect(describeStreak(6)).toBe("Six day streak");
  });

  it("spells a streak of twenty", () => {
    expect(describeStreak(20)).toBe("Twenty day streak");
  });

  it("uses digits past twenty", () => {
    expect(describeStreak(21)).toBe("21 day streak");
  });
});

describe("describeUpNextTime", () => {
  it("is Tomorrow with no reminder", () => {
    expect(describeUpNextTime(null)).toBe("Tomorrow");
  });

  it("is Tomorrow when the reminder is off", () => {
    expect(describeUpNextTime({ enabled: false, time: "06:30" })).toBe("Tomorrow");
  });

  it("names the morning time when the reminder is on", () => {
    expect(describeUpNextTime({ enabled: true, time: "06:30" })).toBe("Tomorrow at 6:30 AM");
  });

  it("names an afternoon time on the 12-hour clock", () => {
    expect(describeUpNextTime({ enabled: true, time: "19:05" })).toBe("Tomorrow at 7:05 PM");
  });

  it("names midnight and noon", () => {
    expect(describeUpNextTime({ enabled: true, time: "00:00" })).toBe("Tomorrow at 12:00 AM");
    expect(describeUpNextTime({ enabled: true, time: "12:00" })).toBe("Tomorrow at 12:00 PM");
  });
});
