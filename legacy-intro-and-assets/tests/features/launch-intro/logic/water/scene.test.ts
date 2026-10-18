import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS, type WaterSettings } from "@/features/launch-intro/logic/water/settings";

/** The phone the prototype was tuned on. */
const PROTOTYPE_STAGE = { width: 390, height: 844 };

/** Every beat, to the millisecond, as [start, end]. */
function roundedBeats(settings: WaterSettings = WATER_SETTINGS) {
  const { beats } = buildWaterScene(settings, PROTOTYPE_STAGE);
  return Object.fromEntries(
    Object.entries(beats).map(([key, beat]) => [
      key,
      [Math.round(beat.start), Math.round(beat.end)],
    ]),
  );
}

describe("buildWaterScene", () => {
  it("times every beat exactly as the v4 prototype does with its settings", () => {
    expect(roundedBeats()).toEqual({
      pour: [0, 1650],
      write: [1650, 6150],
      pause: [6150, 6150],
      fall: [6150, 6873],
      sink: [6873, 6873],
      splash: [6873, 7923],
      hold: [7923, 8223],
      drain: [8223, 9423],
    });
  });

  it("starts the pen once the pool has poured in for TextDrawStartAfterPoolEntry, and everything after with it", () => {
    const beats = roundedBeats({ ...WATER_SETTINGS, textDrawStartAfterPoolEntry: 2650 });

    expect(beats.pour).toEqual([0, 2650]);
    expect(beats.write).toEqual([2650, 7150]);
    expect(beats.drain).toEqual([9223, 10423]);
  });

  it("starts each letter's pen strokes, in writing order, when the writing does", () => {
    const delayed = { ...WATER_SETTINGS, textDrawStartAfterPoolEntry: 600 };
    const { strokes, letterEnds } = buildWaterScene(delayed, PROTOTYPE_STAGE);

    const starts = strokes.map((stroke) => stroke.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(strokes[0]?.start).toBe(600);
    expect(letterEnds.at(-1)).toBeCloseTo(600 + WATER_SETTINGS.writeMs, 6);
  });

  it("reveals the page as the water starts to drain", () => {
    const { beats, revealAt } = buildWaterScene(WATER_SETTINGS, PROTOTYPE_STAGE);

    expect(revealAt).toBe(beats.drain.start);
  });

  it("ends only once the last of the water has left the screen", () => {
    const { beats, total } = buildWaterScene(WATER_SETTINGS, PROTOTYPE_STAGE);

    expect(total).toBeGreaterThan(beats.drain.end);
    expect(total).toBeLessThan(beats.drain.end + 1000);
  });

  it("is the same every time it's built", () => {
    expect(buildWaterScene(WATER_SETTINGS, PROTOTYPE_STAGE)).toEqual(
      buildWaterScene(WATER_SETTINGS, PROTOTYPE_STAGE),
    );
  });
});
