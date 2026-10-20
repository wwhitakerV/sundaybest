import { describeStatusTime } from "@/features/status-bar/logic/status-time";

const at = (time: string) => new Date(`2026-10-19T${time}:00`);

describe("describeStatusTime", () => {
  it("writes a 12-hour time as iOS's bar does: no leading zero, no AM or PM", () => {
    expect(describeStatusTime(at("13:03"), false)).toMatchObject({ hours: "1", minutes: "03" });
  });

  it("writes noon and midnight as 12 on a 12-hour clock", () => {
    expect(describeStatusTime(at("12:47"), false)).toMatchObject({ hours: "12", minutes: "47" });
    expect(describeStatusTime(at("00:11"), false)).toMatchObject({ hours: "12", minutes: "11" });
  });

  it("writes a 24-hour time in full, midnight as 00", () => {
    expect(describeStatusTime(at("13:03"), true)).toMatchObject({ hours: "13", minutes: "03" });
    expect(describeStatusTime(at("00:11"), true)).toMatchObject({ hours: "00", minutes: "11" });
  });

  it("says the time aloud with its half of the day on a 12-hour clock", () => {
    expect(describeStatusTime(at("13:03"), false).spoken).toBe("1:03 PM");
    expect(describeStatusTime(at("09:41"), false).spoken).toBe("9:41 AM");
  });

  it("says a 24-hour time as it's written", () => {
    expect(describeStatusTime(at("13:03"), true).spoken).toBe("13:03");
  });
});
