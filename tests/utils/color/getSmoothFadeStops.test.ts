import { getSmoothFadeStops } from "@/utils/color/getSmoothFadeStops";

describe("getSmoothFadeStops", () => {
  const STOPS = getSmoothFadeStops();

  it("runs from fully clear to fully shown", () => {
    expect(STOPS.at(0)).toEqual({ offset: 0, opacity: 0 });
    expect(STOPS.at(-1)).toEqual({ offset: 1, opacity: 1 });
  });

  it("eases in and out — slow at either end, so neither shows as a line", () => {
    const [, second] = STOPS;
    const beforeLast = STOPS.at(-2);
    expect(second?.opacity).toBeLessThan(second?.offset ?? 0);
    expect(beforeLast?.opacity).toBeGreaterThan(beforeLast?.offset ?? 1);
  });

  it("passes halfway at halfway", () => {
    const middle = STOPS.find(({ offset }) => offset === 0.5);
    expect(middle?.opacity).toBeCloseTo(0.5);
  });

  it("only ever rises", () => {
    STOPS.slice(1).forEach(({ opacity }, index) => {
      expect(opacity).toBeGreaterThan(STOPS.at(index)?.opacity ?? 1);
    });
  });
});
