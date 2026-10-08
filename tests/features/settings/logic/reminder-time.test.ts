import { dateForTime, toLocalTime } from "@/features/settings/logic/reminder-time";

describe("dateForTime", () => {
  it("is today, at that time of day", () => {
    const date = dateForTime("06:30");

    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([6, 30, 0]);
    expect(date.toDateString()).toBe(new Date().toDateString());
  });

  it("falls back to eight o'clock for a time it can't read", () => {
    const date = dateForTime("");

    expect([date.getHours(), date.getMinutes()]).toEqual([8, 0]);
  });
});

describe("toLocalTime", () => {
  it("writes a time of day as the API keeps it, two digits each", () => {
    const date = new Date();
    date.setHours(7, 5, 0, 0);

    expect(toLocalTime(date)).toBe("07:05");
  });

  it("round-trips a time", () => {
    expect(toLocalTime(dateForTime("21:45"))).toBe("21:45");
  });
});
