import { clampUnit } from "@/utils/motion/clampUnit";

describe("clampUnit", () => {
  it("returns a value inside 0 to 1 unchanged", () => {
    expect(clampUnit(0.25)).toBe(0.25);
  });

  it("returns 0 for a value below 0", () => {
    expect(clampUnit(-3)).toBe(0);
  });

  it("returns 1 for a value above 1", () => {
    expect(clampUnit(7.5)).toBe(1);
  });

  it("keeps the ends of the range, 0 and 1", () => {
    expect(clampUnit(0)).toBe(0);
    expect(clampUnit(1)).toBe(1);
  });
});
