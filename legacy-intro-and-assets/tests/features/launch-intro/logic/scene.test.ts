import { buildScene } from "@/features/launch-intro/logic/scene";
import { INTRO_SETTINGS } from "@/features/launch-intro/logic/settings";

/** The phone the prototype was tuned on. */
const PROTOTYPE_STAGE = { width: 390, height: 844 };

describe("buildScene", () => {
  it("times every beat exactly as the locked prototype did", () => {
    const { beats } = buildScene(INTRO_SETTINGS, PROTOTYPE_STAGE);

    const rounded = Object.fromEntries(
      Object.entries(beats).map(([key, beat]) => [
        key,
        [Math.round(beat.start), Math.round(beat.end)],
      ]),
    );
    expect(rounded).toEqual({
      write: [0, 4500],
      pause: [4500, 4500],
      fall: [4500, 5295],
      sink: [5295, 5295],
      splash: [5295, 6345],
      hold: [6345, 6545],
    });
  });

  it("is the same every time it's built", () => {
    expect(buildScene(INTRO_SETTINGS, PROTOTYPE_STAGE)).toEqual(
      buildScene(INTRO_SETTINGS, PROTOTYPE_STAGE),
    );
  });

  it("ends as the full-colour hold does: the page arrives from there", () => {
    const { beats, total } = buildScene(INTRO_SETTINGS, PROTOTYPE_STAGE);

    expect(total).toBe(beats.hold.end);
  });

  it("starts every letter's pen strokes in writing order", () => {
    const { strokes } = buildScene(INTRO_SETTINGS, PROTOTYPE_STAGE);

    const starts = strokes.map((stroke) => stroke.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(strokes[0]?.start).toBe(0);
  });
});
