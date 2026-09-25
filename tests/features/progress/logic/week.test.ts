import { describeDate, formatTime, getWeekTitle } from "@/features/progress/logic/week";

describe("getWeekTitle", () => {
  it("names the month once for a week inside it", () => {
    expect(getWeekTitle("2026-09-20", "2026-09-26")).toEqual({ lead: "September", range: "20–26" });
  });

  it("names both months for a week across two", () => {
    expect(getWeekTitle("2026-08-30", "2026-09-05")).toEqual({ lead: "Aug 30 –", range: "Sep 5" });
  });
});

describe("describeDate", () => {
  it("calls today and tomorrow by name, with the date", () => {
    expect(describeDate("2026-09-23", "2026-09-23")).toBe("Today, Sep 23");
    expect(describeDate("2026-09-24", "2026-09-23")).toBe("Tomorrow, Sep 24");
  });

  it("gives any other day its weekday", () => {
    expect(describeDate("2026-09-26", "2026-09-23")).toBe("Sat, Sep 26");
  });
});

describe("formatTime", () => {
  it("reads a 24-hour time the way a clock does", () => {
    expect(formatTime("06:30")).toBe("6:30 AM");
    expect(formatTime("19:00")).toBe("7:00 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});
