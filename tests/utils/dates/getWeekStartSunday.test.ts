import { getWeekStartSunday } from "@/utils/dates/getWeekStartSunday";

describe("getWeekStartSunday", () => {
  it("finds the Sunday that begins a midweek date's week", () => {
    // Wednesday, 23 September 2026.
    expect(getWeekStartSunday("2026-09-23")).toBe("2026-09-20");
  });

  it("keeps a Sunday as its own week's start", () => {
    expect(getWeekStartSunday("2026-09-20")).toBe("2026-09-20");
  });

  it("goes back across a month for a Saturday", () => {
    // Saturday, 5 September 2026.
    expect(getWeekStartSunday("2026-09-05")).toBe("2026-08-30");
  });
});
