import { frameAt } from "@/features/launch-intro/logic/frame";
import { buildScene } from "@/features/launch-intro/logic/scene";
import { INTRO_SETTINGS } from "@/features/launch-intro/logic/settings";

const STAGE = { width: 390, height: 844 };
const scene = buildScene(INTRO_SETTINGS, STAGE);

/** Every y the water's edge reaches, at time t. */
function edgeYs(t: number): number[] {
  const edge = frameAt(scene, t).edge;
  return edge.filter((_, i) => i % 2 === 1);
}

describe("frameAt", () => {
  it("draws nothing on the first frame: a blank white page", () => {
    const frame = frameAt(scene, 0);

    expect(frame.strokes.every((reveal) => reveal === 0)).toBe(true);
    expect(frame.edge).toEqual([]);
    expect(frame.blobs).toEqual([]);
    expect(frame.tears).toEqual([]);
  });

  it("draws nothing during the blank beat before the pen touches down, while warming the liquid", () => {
    const frame = frameAt(scene, -100);

    expect(frame.strokes.every((reveal) => reveal === 0)).toBe(true);
    expect(frame.edge).toEqual([]);
    expect(frame.tears).toEqual([]);
    expect(frame.warming).toBe(true);
    expect(frameAt(scene, 0).warming).toBe(false);
  });

  it("has the pen partway through the word while writing", () => {
    const frame = frameAt(scene, INTRO_SETTINGS.writeMs / 2);

    expect(frame.strokes.some((reveal) => reveal === 1)).toBe(true);
    expect(frame.strokes.some((reveal) => reveal === 0)).toBe(true);
  });

  it("drips from the letters while they're written", () => {
    expect(frameAt(scene, INTRO_SETTINGS.writeMs * 0.9).tears.length).toBeGreaterThan(0);
  });

  it("is red from edge to edge while full", () => {
    const t = (scene.beats.hold.start + scene.beats.hold.end) / 2;

    expect(frameAt(scene, t).allRed).toBe(true);
    expect(Math.max(...edgeYs(t))).toBeLessThanOrEqual(0);
  });

  it("is full colour right to the end, with no letters left: the page arrives under it", () => {
    const frame = frameAt(scene, scene.total);

    expect(frame.allRed).toBe(true);
    expect(frame.letters.every((letter) => !letter.visible)).toBe(true);
    expect(Math.max(...edgeYs(scene.total))).toBeLessThanOrEqual(0);
  });

  it("lets the letters become liquid as they reach the pool", () => {
    const fall = scene.world.falls[0];
    if (!fall) throw new Error("no falls");

    expect(frameAt(scene, fall.hit - 100).letters[0]?.liquid).toBe(false);
    expect(frameAt(scene, fall.hit).letters[0]?.liquid).toBe(true);
    expect(frameAt(scene, fall.gone + 1).letters[0]?.visible).toBe(false);
  });
});
