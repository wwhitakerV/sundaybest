import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";
import {
  gleamAt,
  letterTiles,
  poolLight,
  poolTiles,
  TEXTURE_BUMPS,
} from "@/features/launch-intro/logic/water/textures";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);

describe("poolTiles", () => {
  it("keeps every tile's start within its own size, so the repeat never shows a gap", () => {
    for (const t of [0, 1234, 5600, 7000]) {
      for (const tile of Object.values(poolTiles(scene, t))) {
        expect(tile.x).toBeGreaterThanOrEqual(-120);
        expect(tile.x).toBeLessThan(-120 + tile.w);
        expect(tile.y).toBeGreaterThanOrEqual(-120);
        expect(tile.y).toBeLessThan(-120 + tile.h);
      }
    }
  });

  it("stretches the caustics tall while the water surges up", () => {
    const surging = scene.beats.splash.start + scene.beats.splash.dur * 0.7;

    expect(poolTiles(scene, surging).causticA.h).toBeGreaterThan(poolTiles(scene, 0).causticA.h);
  });
});

describe("poolLight", () => {
  it("shows none of the living water while the pool is red", () => {
    const light = poolLight(scene, 0);

    expect(light.clear).toBe(0);
    expect(light.body).toBe(0);
  });

  it("shows it at the Water body strength once the pool is clear", () => {
    const light = poolLight(scene, scene.beats.hold.start);

    expect(light.clear).toBe(1);
    expect(light.body).toBeCloseTo(WATER_SETTINGS.waterBody, 6);
  });
});

describe("letterTiles", () => {
  it("keeps each letter's tiles within their size from its own corner", () => {
    const box = { x: 2, y: -1, width: 4, height: 13 };
    for (const tile of Object.values(letterTiles(3, 2500, box))) {
      expect(tile.x).toBeGreaterThanOrEqual(box.x);
      expect(tile.x).toBeLessThan(box.x + tile.w);
    }
  });
});

describe("gleamAt", () => {
  it("doesn't sweep before 0.7 seconds", () => {
    expect(gleamAt(500, WATER_SETTINGS.textWaterGleam).strength).toBe(0);
  });

  it("sweeps across the word for a second every 2.4 seconds", () => {
    expect(gleamAt(1200, WATER_SETTINGS.textWaterGleam).strength).toBeGreaterThan(0);
    expect(gleamAt(2400, WATER_SETTINGS.textWaterGleam).strength).toBe(0);
    expect(gleamAt(3600, WATER_SETTINGS.textWaterGleam).strength).toBeGreaterThan(0);
  });
});

describe("TEXTURE_BUMPS", () => {
  it("draws the textures' unevenness from a fixed sequence, the same every launch", () => {
    expect(TEXTURE_BUMPS.bendU).toHaveLength(9);
    expect(TEXTURE_BUMPS.bendV).toHaveLength(9);
    expect(TEXTURE_BUMPS.calm).toHaveLength(7);
    expect(TEXTURE_BUMPS.patches).toHaveLength(16);
  });
});
