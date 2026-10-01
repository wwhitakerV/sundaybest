import { formatDotDate } from "@/utils/dates/formatDotDate";

describe("formatDotDate", () => {
  it("writes a day as month, day, and year, two digits each, parted by dots", () => {
    expect(formatDotDate("2026-09-30")).toBe("09.30.26");
  });

  it("pads a single-digit month and day", () => {
    expect(formatDotDate("2027-01-05")).toBe("01.05.27");
  });

  it("leaves out the parts a malformed day doesn't have", () => {
    expect(formatDotDate("2026")).toBe("..26");
  });
});
