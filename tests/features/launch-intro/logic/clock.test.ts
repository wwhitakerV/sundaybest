import { clockCrossings } from "@/features/launch-intro/logic/clock";

describe("clockCrossings", () => {
  const moments = { firstHit: 5000, splashStart: 5200, revealAt: 6500, doneAt: 7800 };

  it("passes nothing between beats", () => {
    expect(clockCrossings(1000, 1016, moments)).toEqual({
      drop: false,
      splash: false,
      reveal: false,
      done: false,
    });
  });

  it("knows the frame the letters reach the pool, and the frame it erupts", () => {
    expect(clockCrossings(4990, 5006, moments).drop).toBe(true);
    expect(clockCrossings(5190, 5206, moments).splash).toBe(true);
  });

  it("reveals the page only once strictly past its moment, never while waiting there", () => {
    expect(clockCrossings(6490, 6500, moments).reveal).toBe(false);
    expect(clockCrossings(6500, 6500, moments).reveal).toBe(false);
    expect(clockCrossings(6500, 6516, moments).reveal).toBe(true);
  });

  it("is done once past its end", () => {
    expect(clockCrossings(7790, 7806, moments).done).toBe(true);
  });

  it("reveals and is done on the same frame when they're the same moment, as the pool intro ends", () => {
    const pool = { ...moments, revealAt: 6500, doneAt: 6500 };

    expect(clockCrossings(6500, 6516, pool)).toMatchObject({ reveal: true, done: true });
  });
});
