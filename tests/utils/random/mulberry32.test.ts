import { mulberry32 } from "@/utils/random/mulberry32";

describe("mulberry32", () => {
  it("gives the same sequence for the same seed", () => {
    const a = mulberry32(99);
    const b = mulberry32(99);

    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("gives a different sequence for a different seed", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it("stays within [0, 1)", () => {
    const next = mulberry32(7);
    const values = Array.from({ length: 1000 }, () => next());

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});
