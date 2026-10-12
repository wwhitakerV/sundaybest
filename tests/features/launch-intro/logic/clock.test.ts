import {
  advanceClock,
  MAX_FRAME_MS,
  SETTLE_FRAMES,
  SETTLE_LIMIT_MS,
  canStart,
  smoothFrames,
} from "@/features/launch-intro/logic/clock";

const HOLD_END = 6645;

describe("advanceClock", () => {
  it("moves time on by the frame", () => {
    expect(advanceClock(1000, 16, { ready: true, holdEnd: HOLD_END })).toBe(1016);
  });

  it("waits at the end of the full-red hold until the page underneath is ready", () => {
    expect(advanceClock(HOLD_END - 4, 16, { ready: false, holdEnd: HOLD_END })).toBe(HOLD_END);
    expect(advanceClock(HOLD_END, 16, { ready: false, holdEnd: HOLD_END })).toBe(HOLD_END);
  });

  it("carries on past the hold once ready", () => {
    expect(advanceClock(HOLD_END, 16, { ready: true, holdEnd: HOLD_END })).toBe(HOLD_END + 16);
  });

  it("never runs backwards", () => {
    expect(advanceClock(500, -30, { ready: true, holdEnd: HOLD_END })).toBe(500);
  });

  it("moves at most a frame's worth at once, so a stall pauses the pen instead of skipping a stroke", () => {
    expect(advanceClock(100, 250, { ready: true, holdEnd: HOLD_END })).toBe(100 + MAX_FRAME_MS);
  });
});

describe("smoothFrames", () => {
  it("counts frames that come on time", () => {
    expect(smoothFrames(2, 16)).toBe(3);
  });

  it("starts the count again after a stalled frame", () => {
    expect(smoothFrames(2, 120)).toBe(0);
  });
});

describe("canStart", () => {
  it("waits for a few on-time frames: the canvas drawing", () => {
    expect(canStart(SETTLE_FRAMES - 1, 0)).toBe(false);
    expect(canStart(SETTLE_FRAMES, 0)).toBe(true);
  });

  it("never waits for good, on a phone whose frames never come on time", () => {
    expect(canStart(0, SETTLE_LIMIT_MS)).toBe(true);
  });
});
