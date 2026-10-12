import { levelAt } from "@/features/launch-intro/logic/pool";
import { buildScene } from "@/features/launch-intro/logic/scene";
import { INTRO_SETTINGS } from "@/features/launch-intro/logic/settings";

const STAGE = { width: 390, height: 844 };
const scene = buildScene(INTRO_SETTINGS, STAGE);
const firstLanding = Math.min(...scene.world.drips.map((drip) => drip.th));

describe("levelAt", () => {
  it("is empty until the first drip lands", () => {
    expect(levelAt(scene.world, 0)).toBe(0);
    expect(levelAt(scene.world, firstLanding)).toBe(0);
  });

  it("grows once drips land", () => {
    expect(levelAt(scene.world, firstLanding + 300)).toBeGreaterThan(0);
  });

  it("never falls before the eruption", () => {
    let previous = 0;
    for (let t = 0; t <= scene.beats.splash.start; t += 25) {
      const level = levelAt(scene.world, t);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it("stands at about the pool height as the letters let go", () => {
    const expected = (INTRO_SETTINGS.poolPct / 100) * STAGE.height;
    const level = levelAt(scene.world, scene.beats.pause.end);

    // The last drops to land are still settling in.
    expect(level).toBeGreaterThan(expected * 0.85);
    expect(level).toBeLessThanOrEqual(expected * 1.01);
  });
});
