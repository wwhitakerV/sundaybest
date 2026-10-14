import { clearAt, levelAt } from "@/features/launch-intro/logic/water/pool";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);
const poolHeight = (WATER_SETTINGS.poolPct / 100) * STAGE.height;
const firstLanding = Math.min(...scene.world.drips.map((drip) => drip.th));

describe("levelAt", () => {
  it("is empty before the pool starts to pour in", () => {
    expect(levelAt(scene.world, 0)).toBe(0);
  });

  it("stands at the pool height once it's poured in, before any drip has landed", () => {
    expect(levelAt(scene.world, Math.min(firstLanding, WATER_SETTINGS.pourMs))).toBeCloseTo(
      poolHeight,
      0,
    );
  });

  it("rises from the drips by WaterVolumeFromDrip of a pool by the time the letters let go", () => {
    const level = levelAt(scene.world, scene.beats.pause.end);
    const risen = 1 + WATER_SETTINGS.waterVolumeFromDrip;

    // The last drops to land are still settling in; a few more than the pool's worth have.
    expect(level).toBeGreaterThan(poolHeight * (risen - 0.15));
    expect(level).toBeLessThanOrEqual(poolHeight * (risen + 0.02));
  });

  it("rises from the drips only as much as WaterVolumeFromDrip says", () => {
    const none = buildWaterScene({ ...WATER_SETTINGS, waterVolumeFromDrip: 0 }, STAGE);

    expect(levelAt(none.world, none.beats.pause.end)).toBeCloseTo(poolHeight, 0);
  });
});

describe("clearAt", () => {
  it("is all red while only the poured-in pool is there", () => {
    expect(clearAt(scene.world, firstLanding)).toBe(0);
  });

  it("is clear water by the time the letters let go", () => {
    expect(clearAt(scene.world, scene.beats.fall.end)).toBe(1);
  });

  it("still clears as the drips land when they raise the pool no higher", () => {
    const none = buildWaterScene({ ...WATER_SETTINGS, waterVolumeFromDrip: 0 }, STAGE);

    expect(clearAt(none.world, none.beats.write.end * 0.8)).toBeGreaterThan(0);
    expect(clearAt(none.world, none.beats.fall.end)).toBe(1);
  });
});
