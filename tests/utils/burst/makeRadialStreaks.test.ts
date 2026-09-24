import { makeRadialStreaks } from "@/utils/burst/makeRadialStreaks";

const OPTIONS = { count: 5, centerDeg: 90, spreadDeg: 60, reach: 30, length: 10, shortRatio: 0.5 };

describe("makeRadialStreaks", () => {
  it("fans the streaks evenly around the direction it points", () => {
    expect(makeRadialStreaks(OPTIONS).map((streak) => streak.angleDeg)).toEqual([
      60, 75, 90, 105, 120,
    ]);
  });

  it("points a burst out of the left side leftward", () => {
    const angles = makeRadialStreaks({ ...OPTIONS, centerDeg: -90 }).map((s) => s.angleDeg);

    expect(angles).toEqual([-120, -105, -90, -75, -60]);
  });

  it("sends every long streak the same distance, and the short ones a share of it", () => {
    expect(makeRadialStreaks(OPTIONS).map((streak) => streak.reach)).toEqual([30, 15, 30, 15, 30]);
  });

  it("points a single streak straight along the direction", () => {
    expect(makeRadialStreaks({ ...OPTIONS, count: 1 })).toEqual([
      { angleDeg: 90, reach: 30, length: 10 },
    ]);
  });

  it("returns no streaks for a count of zero", () => {
    expect(makeRadialStreaks({ ...OPTIONS, count: 0 })).toEqual([]);
  });
});
