import { formatShortDate } from "@/utils/dates/formatShortDate";

describe("formatShortDate", () => {
  it("shows the month and day", () => {
    expect(formatShortDate("2026-09-05T07:05:00.000Z")).toBe("Sep 5");
  });

  it("reads the date in UTC, as it's stored", () => {
    expect(formatShortDate("2026-01-06T23:30:00.000Z")).toBe("Jan 6");
  });
});
