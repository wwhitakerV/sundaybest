import { makeBurstStreaks } from "@/utils/burst/makeBurstStreaks";

const OPTIONS = {
  count: 5,
  spreadDeg: 120,
  longRise: 30,
  longLength: 10,
  shortRise: 20,
  shortLength: 6,
};

/** How high above the origin a streak's centre ends. */
function endRise(streak: { angleDeg: number; reach: number }) {
  return streak.reach * Math.cos((streak.angleDeg * Math.PI) / 180);
}

describe("makeBurstStreaks", () => {
  it("makes the requested number of streaks", () => {
    expect(makeBurstStreaks(OPTIONS)).toHaveLength(5);
  });

  it("spreads the streaks evenly across a fan centred on straight up", () => {
    expect(makeBurstStreaks(OPTIONS).map((streak) => streak.angleDeg)).toEqual([
      -60, -30, 0, 30, 60,
    ]);
  });

  it("alternates long and short streaks, starting long", () => {
    expect(makeBurstStreaks(OPTIONS).map((streak) => streak.length)).toEqual([10, 6, 10, 6, 10]);
  });

  it("ends every long streak at the same height, however far it leans", () => {
    const [outer, , middle] = makeBurstStreaks(OPTIONS);

    expect(endRise(outer!)).toBeCloseTo(30);
    expect(endRise(middle!)).toBeCloseTo(30);
  });

  it("ends the short streaks at their own height", () => {
    expect(endRise(makeBurstStreaks(OPTIONS)[1]!)).toBeCloseTo(20);
  });

  it("points a single streak straight up", () => {
    expect(makeBurstStreaks({ ...OPTIONS, count: 1 })).toEqual([
      { angleDeg: 0, reach: 30, length: 10 },
    ]);
  });

  it("returns no streaks for a count of zero", () => {
    expect(makeBurstStreaks({ ...OPTIONS, count: 0 })).toEqual([]);
  });
});
