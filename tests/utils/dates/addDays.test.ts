import { addDays } from "@/utils/dates/addDays";

describe("addDays", () => {
  it("moves a date forward", () => {
    expect(addDays("2026-09-23", 1)).toBe("2026-09-24");
  });

  it("moves a date back, across a month", () => {
    expect(addDays("2026-09-01", -2)).toBe("2026-08-30");
  });

  it("moves by whole weeks", () => {
    expect(addDays("2026-09-23", -21)).toBe("2026-09-02");
  });
});
