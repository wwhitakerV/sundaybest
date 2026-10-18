import { meltAt, warmMelt } from "@/features/launch-intro/logic/water/melt";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";

const STAGE = { width: 390, height: 844 };
const scene = buildWaterScene(WATER_SETTINGS, STAGE);
const fall = scene.world.falls[0];
if (!fall) throw new Error("no falls");

describe("meltAt", () => {
  it("doesn't melt a letter before it lets go", () => {
    expect(meltAt(WATER_SETTINGS.melt, fall, 0, fall.start).melting).toBe(false);
  });

  it("draws a letter out further the further it has fallen", () => {
    const early = meltAt(WATER_SETTINGS.melt, fall, 0, fall.start + 100);
    const late = meltAt(WATER_SETTINGS.melt, fall, 0, fall.hit);

    expect(early.melting).toBe(true);
    expect(late.stretch).toBeGreaterThan(early.stretch);
  });

  it("has a letter all streams as it lands", () => {
    expect(meltAt(WATER_SETTINGS.melt, fall, 0, fall.hit).shaped).toBe(1);
  });

  it("doesn't melt at all with Melt at zero", () => {
    expect(meltAt(0, fall, 0, fall.hit).melting).toBe(false);
  });
});

describe("warmMelt", () => {
  it("is a letter part-way melted, so the melt's filter can be put to work before the intro starts", () => {
    const melt = warmMelt(WATER_SETTINGS.melt);

    expect(melt.melting).toBe(true);
    expect(melt.m).toBeGreaterThan(0);
    expect(melt.m).toBeLessThan(1);
  });
});
