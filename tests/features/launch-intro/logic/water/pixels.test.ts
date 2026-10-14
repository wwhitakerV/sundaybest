import {
  letterBox,
  letterToPixels,
  pointsToPixels,
  unionBox,
} from "@/features/launch-intro/logic/water/pixels";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";
import { WORD } from "@/features/launch-intro/logic/wordmark";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);
const { cx, cy, ws } = scene.world;
const PR = 3;

describe("pointsToPixels", () => {
  it("scales a tile in points to the screen's pixels", () => {
    expect(pointsToPixels({ x: -120, y: 10, w: 223, h: 300 }, PR)).toEqual({
      x: -360,
      y: 30,
      w: 669,
      h: 900,
    });
  });
});

describe("letterToPixels", () => {
  it("puts a tile in the wordmark's units where the word sits on the screen, in pixels", () => {
    const tile = letterToPixels(scene, { x: 0, y: 0, w: 1.7, h: 1.7 }, 0, PR);

    expect(tile.x).toBeCloseTo((cx - (WORD.width / 2) * ws) * PR, 6);
    expect(tile.y).toBeCloseTo((cy - (WORD.height / 2) * ws) * PR, 6);
    expect(tile.w).toBeCloseTo(1.7 * ws * PR, 6);
  });

  it("carries the tile down with its letter as it falls", () => {
    const resting = letterToPixels(scene, { x: 2, y: 1, w: 1.5, h: 1.5 }, 0, PR);
    const fallen = letterToPixels(scene, { x: 2, y: 1, w: 1.5, h: 1.5 }, 100, PR);

    expect(fallen.y - resting.y).toBeCloseTo(100 * PR, 6);
    expect(fallen.x).toBe(resting.x);
  });
});

describe("letterBox", () => {
  const region = { x: 3, y: -1, width: 4, height: 13 };

  it("covers the letter's region on the screen, in pixels", () => {
    const box = letterBox(scene, region, 0, PR);
    const exact = letterToPixels(scene, { x: 3, y: -1, w: 4, h: 13 }, 0, PR);

    expect(box.x).toBeLessThanOrEqual(exact.x);
    expect(box.y).toBeLessThanOrEqual(exact.y);
    expect(box.x + box.width).toBeGreaterThanOrEqual(exact.x + exact.w);
    expect(box.y + box.height).toBeGreaterThanOrEqual(exact.y + exact.h);
  });

  it("has room for the letter's tilt as it falls, and no more than that", () => {
    const box = letterBox(scene, region, 0, PR);

    expect(box.width).toBeLessThan(region.width * ws * PR * 2);
  });
});

describe("unionBox", () => {
  it("covers every box given, so one layer can hold every letter", () => {
    expect(
      unionBox([
        { x: 10, y: 20, width: 30, height: 40 },
        { x: 50, y: 5, width: 10, height: 10 },
      ]),
    ).toEqual({ x: 10, y: 5, width: 50, height: 55 });
  });

  it("is nothing when there's nothing to cover", () => {
    expect(unionBox([])).toBeNull();
  });
});
