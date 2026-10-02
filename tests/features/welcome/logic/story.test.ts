import { getTurnMs } from "@/features/welcome/logic/lift-timing";
import {
  FAN,
  SIDE_CARDS,
  STAGE_SLIDE,
  STORY_BEATS,
  STORY_CARDS,
  STORY_LOOP_MS,
  getFanDelayMs,
  getLiftsFor,
  isStageShown,
  type StoryPhase,
} from "@/features/welcome/logic/story";

const onStage = (card: (typeof STORY_CARDS)[number]["key"]): StoryPhase => ({
  kind: "focus",
  card,
});

describe("STORY_BEATS", () => {
  it("arrives first and leaves last, looping between", () => {
    expect(STORY_BEATS.at(0)?.phase).toEqual({ kind: "arrive" });
    expect(STORY_BEATS.at(-1)?.phase).toEqual({ kind: "leave" });
  });

  it("waits a breath after the last side phone starts fanning out before the first turn", () => {
    expect(STORY_BEATS.at(0)?.holdMs).toBe(getFanDelayMs(SIDE_CARDS.length - 1, true) + 500);
  });

  it("takes every turn once, in order", () => {
    const turns = STORY_BEATS.flatMap(({ phase }) => (phase.kind === "focus" ? [phase.card] : []));

    expect(turns).toEqual(STORY_CARDS.map((card) => card.key));
  });

  it("lifts step 2's days and Create my plan together, in one lift", () => {
    expect(getLiftsFor("plan")).toHaveLength(1);
  });

  it("holds each turn long enough for its lifts", () => {
    const planTurn = STORY_BEATS.find(
      ({ phase }) => phase.kind === "focus" && phase.card === "plan",
    );

    expect(planTurn?.holdMs).toBe(getTurnMs(getLiftsFor("plan")));
  });

  it("lets the hand fold and the stage finish fading out before it comes back", () => {
    expect(STORY_BEATS.at(-1)?.holdMs).toBeGreaterThan(
      STAGE_SLIDE.outDelayMs + STAGE_SLIDE.hopMs + STAGE_SLIDE.dropMs,
    );
  });
});

describe("STORY_LOOP_MS", () => {
  it("is one whole loop: every beat, back to back", () => {
    const total = STORY_BEATS.map((beat) => beat.holdMs).reduce((a, b) => a + b);

    expect(STORY_LOOP_MS).toBe(total);
  });
});

describe("isStageShown", () => {
  it("shows the stage from arriving through the last turn, and hides it to leave", () => {
    expect(isStageShown({ kind: "arrive" })).toBe(true);
    expect(isStageShown(onStage("quiz"))).toBe(true);
    expect(isStageShown({ kind: "leave" })).toBe(false);
  });
});

describe("SIDE_CARDS", () => {
  it("fans an equal number of phones on each side, mirrored", () => {
    const angles = SIDE_CARDS.map((card) => card.angleDeg);

    expect(angles.filter((angle) => angle < 0)).toHaveLength(angles.length / 2);
    expect([...angles].sort((a, b) => a - b)).toEqual(
      angles.map((angle) => -angle).sort((a, b) => a - b),
    );
  });
});

describe("getFanDelayMs", () => {
  it("fans the side phones out only once the big phone is up", () => {
    expect(getFanDelayMs(0, true)).toBe(FAN.outFromMs);
  });

  it("fans them out one at a time, left to right", () => {
    const delays = SIDE_CARDS.map((_, index) => getFanDelayMs(index, true));

    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(getFanDelayMs(1, true) - getFanDelayMs(0, true)).toBe(FAN.outStaggerMs);
  });

  it("folds both sides back in to the middle together, at once", () => {
    expect(SIDE_CARDS.map((_, index) => getFanDelayMs(index, false))).toEqual(
      SIDE_CARDS.map(() => 0),
    );
  });

  it("drops the phone the moment the side phones have folded in", () => {
    expect(STAGE_SLIDE.outDelayMs).toBe(FAN.inMs);
  });
});
