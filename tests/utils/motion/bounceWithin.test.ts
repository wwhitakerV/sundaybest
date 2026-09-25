import { bounceWithin } from "@/utils/motion/bounceWithin";

describe("bounceWithin", () => {
  it("leaves a value between 0 and 1 as it is", () => {
    expect(bounceWithin(0)).toBe(0);
    expect(bounceWithin(0.4)).toBe(0.4);
    expect(bounceWithin(1)).toBe(1);
  });

  it("turns an overshoot past 0 back off it, as far as it went past", () => {
    expect(bounceWithin(-0.05)).toBeCloseTo(0.05);
  });

  it("turns an overshoot past 1 back off it, as far as it went past", () => {
    expect(bounceWithin(1.05)).toBeCloseTo(0.95);
  });
});
