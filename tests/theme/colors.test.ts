import { motion } from "@/theme";
import { darkTheme, lightTheme } from "@/theme/tokens";

type Hex = `#${string}`;

function channels(hex: Hex): [number, number, number] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function sum(hex: Hex): number {
  return channels(hex).reduce((total, channel) => total + channel, 0);
}

const light = new Map<string, string>(Object.entries(lightTheme.colors));
const dark = new Map<string, string>(Object.entries(darkTheme.colors));

describe("every line token", () => {
  it.each(["containerBorder", "divider", "grabber", "progressTrack"])(
    "%s is a solid colour in both themes",
    (name) => {
      expect(light.get(name)).toEqual(expect.stringMatching(/^#[0-9A-Fa-f]{6}$/));
      expect(dark.get(name)).toEqual(expect.stringMatching(/^#[0-9A-Fa-f]{6}$/));
    },
  );
});

describe("the light theme's neutrals", () => {
  it.each([
    "background",
    "surface",
    "divider",
    "containerBorder",
    "grabber",
    "progressTrack",
    "sequenceLine",
    "border",
    "borderStrong",
    "textMuted",
    "textInactive",
  ])("%s has no red cast", (name) => {
    const [red, green, blue] = channels(light.get(name) as Hex);

    expect(red).toBeLessThanOrEqual(green);
    expect(red).toBeLessThanOrEqual(blue);
  });

  it("goes surface, then divider, then containerBorder, each darker", () => {
    expect(sum(light.get("surface") as Hex)).toBeGreaterThan(sum(light.get("divider") as Hex));
    expect(sum(light.get("divider") as Hex)).toBeGreaterThan(
      sum(light.get("containerBorder") as Hex),
    );
  });
});

describe("motion", () => {
  it("snaps without overshoot, and quickly", () => {
    expect(motion.snap.dampingRatio).toBeGreaterThanOrEqual(1);
    expect(motion.snap.overshootClamping).toBe(true);
    expect(motion.snap.duration).toBeLessThanOrEqual(250);
  });

  it("slides a sheet without overshoot", () => {
    expect(motion.sheet.dampingRatio).toBeGreaterThanOrEqual(1);
    expect(motion.sheet.overshootClamping).toBe(true);
  });

  it("slides selection outlines on one shared spring", () => {
    expect(motion.slide).toEqual({ damping: 18, stiffness: 220, mass: 0.8 });
  });

  it("lets anything leave within a quarter second", () => {
    expect(motion.exitMs).toBeGreaterThan(0);
    expect(motion.exitMs).toBeLessThanOrEqual(250);
  });
});
