import { formatClockTime } from "@/utils/time/formatClockTime";

describe("formatClockTime", () => {
  it("shows a 24-hour time as a clock shows it", () => {
    expect(formatClockTime("06:30")).toBe("6:30 AM");
    expect(formatClockTime("19:00")).toBe("7:00 PM");
  });

  it("shows midnight and noon as twelve", () => {
    expect(formatClockTime("00:05")).toBe("12:05 AM");
    expect(formatClockTime("12:00")).toBe("12:00 PM");
  });

  it("reads an hour with no minutes as on the hour", () => {
    expect(formatClockTime("7")).toBe("7:00 AM");
  });
});

describe("formatClockTime on a 24-hour clock", () => {
  it("shows the hour as it's kept, two digits, with no AM or PM", () => {
    expect(formatClockTime("06:30", { twentyFourHour: true })).toBe("06:30");
    expect(formatClockTime("15:04", { twentyFourHour: true })).toBe("15:04");
  });

  it("shows midnight as zero hundred", () => {
    expect(formatClockTime("00:05", { twentyFourHour: true })).toBe("00:05");
  });
});
