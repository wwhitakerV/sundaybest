import { formatWeekday } from "@/utils/dates/formatWeekday";

describe("formatWeekday", () => {
  it("names a date's weekday, short", () => {
    expect(formatWeekday("2026-09-22")).toBe("Tue");
  });

  it("reads the date in UTC, so the day never shifts", () => {
    expect(formatWeekday("2026-09-20")).toBe("Sun");
  });
});
