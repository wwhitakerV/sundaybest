import {
  LIFT,
  LIFTED_AT_MS,
  getActiveLift,
  getLiftElapsedMs,
  getLiftState,
  getScrollTargetIndex,
  SCROLL,
  getTurnMs,
} from "@/features/welcome/logic/lift-timing";

const SCENE_MS = 1000;

describe("getLiftState", () => {
  it("keeps the piece on the phone until the card has settled", () => {
    expect(getLiftState(LIFT.startMs - 1, SCENE_MS)).toEqual({ overlay: false, lifted: false });
  });

  it("lifts the piece, and keeps it up while its scene plays", () => {
    expect(getLiftState(LIFT.startMs, SCENE_MS)).toEqual({ overlay: true, lifted: true });
    expect(getLiftState(LIFTED_AT_MS + SCENE_MS - 1, SCENE_MS)).toEqual({
      overlay: true,
      lifted: true,
    });
  });

  it("sends it back down once the scene is over, keeping the copy until it lands", () => {
    expect(getLiftState(LIFTED_AT_MS + SCENE_MS, SCENE_MS)).toEqual({
      overlay: true,
      lifted: false,
    });
  });

  it("hands back to the phone's copy after it has landed", () => {
    const landed = LIFTED_AT_MS + SCENE_MS + LIFT.backMs + LIFT.handoffMs;

    expect(getLiftState(landed, SCENE_MS)).toEqual({ overlay: false, lifted: false });
  });

  it("fits the whole lift inside the card's turn", () => {
    const landed = LIFTED_AT_MS + SCENE_MS + LIFT.backMs + LIFT.handoffMs;

    expect(getTurnMs([{ sceneMs: SCENE_MS }])).toBeGreaterThan(landed);
  });
});

describe("a turn with several lifts", () => {
  const LIFTS = [{ sceneMs: 1000 }, { sceneMs: 500 }];
  const secondStartMs =
    LIFT.startMs + LIFT.outMs + 1000 + LIFT.backMs + LIFT.handoffMs + LIFT.gapMs;

  it("plays the first lift first, on the turn's own clock", () => {
    expect(getActiveLift(LIFT.startMs, LIFTS)).toMatchObject({
      index: 0,
      elapsedMs: LIFT.startMs,
    });
  });

  it("pauses between lifts, with nothing off the phone", () => {
    expect(getActiveLift(secondStartMs - 1, LIFTS)).toBeNull();
  });

  it("plays the second once the first has landed, its clock starting as if it were first", () => {
    expect(getActiveLift(secondStartMs, LIFTS)).toMatchObject({
      index: 1,
      elapsedMs: LIFT.startMs,
    });
  });

  it("holds a later lift's piece at its start until its lift", () => {
    expect(getLiftElapsedMs(LIFT.startMs, LIFTS, 1)).toBe(0);
  });

  it("shows every piece finished once the turn is over", () => {
    expect(getLiftElapsedMs(Infinity, LIFTS, 1)).toBe(Infinity);
  });

  it("lasts long enough for both lifts", () => {
    const secondLandedMs = secondStartMs + LIFT.outMs + 500 + LIFT.backMs + LIFT.handoffMs;

    expect(getTurnMs(LIFTS)).toBeGreaterThan(secondLandedMs);
  });
});

describe("scrolling into view before a lift", () => {
  const LEAD = SCROLL.leadMs;
  const LIFTS = [
    { sceneMs: 1000, leadMs: LEAD },
    { sceneMs: 500, leadMs: LEAD },
  ];

  it("waits out the lead-in before the first lift", () => {
    expect(getActiveLift(LIFT.startMs + LEAD - 1, LIFTS)).toBeNull();
    expect(getActiveLift(LIFT.startMs + LEAD, LIFTS)?.index).toBe(0);
  });

  it("stays at the top until the first lead-in begins", () => {
    expect(getScrollTargetIndex(LIFT.startMs - 1, LIFTS)).toBeNull();
  });

  it("scrolls to each piece as its lead-in begins", () => {
    expect(getScrollTargetIndex(LIFT.startMs, LIFTS)).toBe(0);

    const firstLandedMs =
      LIFT.startMs + LEAD + LIFT.outMs + 1000 + LIFT.backMs + LIFT.handoffMs + LIFT.gapMs;
    expect(getScrollTargetIndex(firstLandedMs, LIFTS)).toBe(1);
  });

  it("gives the scroll time to finish before the piece lifts", () => {
    expect(SCROLL.leadMs).toBeGreaterThan(SCROLL.durationMs);
  });
});

describe("waiting before a lift's lead-in", () => {
  const LIFTS = [{ sceneMs: 1000, waitMs: 500, leadMs: SCROLL.leadMs }];

  it("holds the screen still before it starts scrolling", () => {
    expect(getScrollTargetIndex(LIFT.startMs + 499, LIFTS)).toBeNull();
    expect(getScrollTargetIndex(LIFT.startMs + 500, LIFTS)).toBe(0);
  });

  it("lifts once the wait and the lead-in are both over", () => {
    expect(getActiveLift(LIFT.startMs + 500 + SCROLL.leadMs - 1, LIFTS)).toBeNull();
    expect(getActiveLift(LIFT.startMs + 500 + SCROLL.leadMs, LIFTS)?.index).toBe(0);
  });
});

describe("pausing after a lift", () => {
  const LIFTS = [{ sceneMs: 1000, afterMs: 700 }, { sceneMs: 500 }];
  const firstLandedMs = LIFT.startMs + LIFT.outMs + 1000 + LIFT.backMs + LIFT.handoffMs;

  it("holds still before the next lift", () => {
    expect(getActiveLift(firstLandedMs + LIFT.gapMs + 699, LIFTS)).toBeNull();
    expect(getActiveLift(firstLandedMs + LIFT.gapMs + 700, LIFTS)?.index).toBe(1);
  });

  it("holds still before the turn ends, after the last", () => {
    const withPause = getTurnMs([{ sceneMs: 1000, afterMs: 700 }]);

    expect(withPause).toBe(getTurnMs([{ sceneMs: 1000 }]) + 700);
  });
});
