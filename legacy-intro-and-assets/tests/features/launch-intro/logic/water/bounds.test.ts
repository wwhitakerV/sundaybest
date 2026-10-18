import { wetTop } from "@/features/launch-intro/logic/water/bounds";
import { waterFrameAt } from "@/features/launch-intro/logic/water/frame";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";
import { WORD } from "@/features/launch-intro/logic/wordmark";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);
const at = (t: number) => wetTop(scene, waterFrameAt(scene, t));

describe("wetTop", () => {
  it("has no water to keep to before the pool pours in", () => {
    expect(at(-100)).toBeNull();
  });

  it("keeps to the bottom of the screen while the pool is low", () => {
    const top = at(scene.beats.write.start + 2000);

    expect(top).not.toBeNull();
    expect(top).toBeGreaterThan(STAGE.height / 2);
  });

  it("reaches above every drop the pool has thrown up, with room for its edge", () => {
    const t = scene.beats.write.start + 2000;
    const { blobs, edge } = waterFrameAt(scene, t);
    const highest = Math.min(
      ...edge.filter((_, i) => i % 2 === 1),
      ...blobs.filter((_, i) => i % 4 === 1),
    );

    expect(at(t)).toBeLessThan(highest);
  });

  it("takes in the letters as they pour in, from their tops", () => {
    const fall = scene.world.falls[0];
    const letter = waterFrameAt(scene, fall?.hit ?? 0).letters[0];
    if (!letter) throw new Error("no letters");
    const { cy, ws } = scene.world;

    expect(at(fall?.hit ?? 0)).toBeLessThan(cy - (WORD.height / 2) * ws + letter.dy);
  });

  it("is the whole screen once the water fills it", () => {
    expect(at(scene.beats.hold.start)).toBeLessThanOrEqual(0);
  });
});
