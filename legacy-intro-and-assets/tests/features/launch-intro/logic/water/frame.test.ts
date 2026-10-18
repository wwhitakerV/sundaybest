import { waterFrameAt } from "@/features/launch-intro/logic/water/frame";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);
const { beats } = scene;

/** Every y the water's edge reaches, at time t. */
function edgeYs(t: number): number[] {
  return waterFrameAt(scene, t).edge.filter((_, i) => i % 2 === 1);
}

describe("waterFrameAt", () => {
  it("draws nothing during the blank beat before the pour, while warming the water", () => {
    const frame = waterFrameAt(scene, -100);

    expect(frame.edge).toEqual([]);
    expect(frame.tears).toEqual([]);
    expect(frame.strokes.every((reveal) => reveal === 0)).toBe(true);
    expect(frame.warming).toBe(true);
    expect(waterFrameAt(scene, 0).warming).toBe(false);
  });

  it("pours the pool in from the bottom right first", () => {
    const edge = waterFrameAt(scene, WATER_SETTINGS.pourMs * 0.1).edge;
    const right = edge.at(-1) ?? STAGE.height;
    const left = edge[1] ?? STAGE.height;

    expect(right).toBeLessThan(STAGE.height);
    expect(left).toBeGreaterThan(STAGE.height - 1);
  });

  it("has the pen partway through the word while writing", () => {
    const frame = waterFrameAt(scene, beats.write.start + WATER_SETTINGS.writeMs / 2);

    expect(frame.strokes.some((reveal) => reveal === 1)).toBe(true);
    expect(frame.strokes.some((reveal) => reveal === 0)).toBe(true);
  });

  it("drips from the letters while they're written", () => {
    expect(waterFrameAt(scene, beats.write.end * 0.9).tears.length).toBeGreaterThan(0);
  });

  it("fills the screen with water while it holds, the page still covered", () => {
    const t = (beats.hold.start + beats.hold.end) / 2;
    const frame = waterFrameAt(scene, t);

    expect(frame.full).toBe(true);
    expect(Math.max(...edgeYs(t))).toBeLessThanOrEqual(0);
  });

  it("has the water falling away from the top as it drains", () => {
    const t = beats.drain.start + beats.drain.dur * 0.5;

    expect(waterFrameAt(scene, t).full).toBe(false);
    expect(Math.min(...edgeYs(t))).toBeGreaterThan(0);
  });

  it("has nothing left to draw once it's over", () => {
    const frame = waterFrameAt(scene, scene.total);

    expect(Math.min(...edgeYs(scene.total))).toBeGreaterThanOrEqual(STAGE.height);
    expect(frame.tears).toEqual([]);
    expect(frame.blobs).toEqual([]);
  });

  it("lets the letters melt as they fall and join the water as they reach it", () => {
    const fall = scene.world.falls[0];
    if (!fall) throw new Error("no falls");

    expect(waterFrameAt(scene, fall.hit - 100).letters[0]?.liquid).toBe(false);
    expect(waterFrameAt(scene, fall.hit - 100).letters[0]?.melt.melting).toBe(true);
    expect(waterFrameAt(scene, fall.hit).letters[0]?.liquid).toBe(true);
    expect(waterFrameAt(scene, fall.gone + 1).letters[0]?.visible).toBe(false);
  });
});
