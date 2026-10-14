import { uncoveredTo } from "@/features/launch-intro/logic/water/drain";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);
const { drain } = scene.beats;

describe("uncoveredTo", () => {
  it("uncovers nothing before the water starts to drain", () => {
    expect(uncoveredTo(scene, drain.start)).toBeLessThanOrEqual(0);
  });

  it("uncovers the page from the top down as the water falls away", () => {
    const early = uncoveredTo(scene, drain.start + drain.dur * 0.4);
    const later = uncoveredTo(scene, drain.start + drain.dur * 0.6);

    expect(early).toBeGreaterThan(0);
    expect(later).toBeGreaterThan(early);
    expect(later).toBeLessThan(STAGE.height);
  });

  it("only ever moves down", () => {
    let previous = -Infinity;
    for (let t = drain.start; t <= scene.total; t += 16) {
      const line = uncoveredTo(scene, t);
      expect(line).toBeGreaterThanOrEqual(previous);
      previous = line;
    }
  });

  it("has uncovered the whole screen once the intro is over", () => {
    expect(uncoveredTo(scene, scene.total)).toBeGreaterThanOrEqual(STAGE.height);
  });
});
