import {
  pourIn,
  pourReached,
  wallHitAt,
  wallSurge,
  type Pour,
} from "@/features/launch-intro/logic/water/pour";

const POUR: Pour = { ms: 750, depth: 76, width: 390, sx: 1 };

describe("pourIn", () => {
  it("has nothing poured in at the start, and all of it by the pour-in time", () => {
    expect(pourIn(POUR, 0)).toBe(0);
    expect(pourIn(POUR, POUR.ms)).toBe(1);
    expect(pourIn(POUR, POUR.ms * 3)).toBe(1);
  });

  it("pours quickly at first, then eases in", () => {
    expect(pourIn(POUR, POUR.ms / 4)).toBeGreaterThan(0.25);
  });
});

describe("pourReached", () => {
  it("comes in from the right: the right side has water before the left", () => {
    const t = POUR.ms * 0.15;

    expect(pourReached(POUR, 380, t)).toBe(1);
    expect(pourReached(POUR, 10, t)).toBe(0);
  });

  it("has reached the whole width once its front passes the left wall", () => {
    expect(pourReached(POUR, 0, POUR.ms)).toBe(1);
  });
});

describe("wallSurge", () => {
  const hit = wallHitAt(POUR);

  it("does nothing until the pour's front reaches the left wall", () => {
    expect(wallSurge(POUR, 0, hit - 1)).toBe(0);
  });

  it("runs up the left wall after the front hits it, higher than the pool will stand", () => {
    const peak = wallSurge(POUR, 0, hit + POUR.ms * 0.1);

    expect(peak).toBeGreaterThan(POUR.depth);
    expect(wallSurge(POUR, 200, hit + POUR.ms * 0.1)).toBeLessThan(peak / 10);
  });

  it("sends a crest back across the pool as the run-up falls", () => {
    const later = hit + POUR.ms * 0.1 + POUR.ms * 0.3;

    expect(wallSurge(POUR, 195, later)).toBeGreaterThan(wallSurge(POUR, 0, later));
  });

  it("has died away long after the pour", () => {
    expect(wallSurge(POUR, 100, POUR.ms * 3.3)).toBe(0);
  });
});
