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
});
