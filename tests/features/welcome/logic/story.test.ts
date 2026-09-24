import { getTurnMs } from "@/features/welcome/logic/scenes";
import {
  FAN,
  SIDE_CARDS,
  STAGE_SLIDE,
  STORY_BEATS,
  STORY_CARDS,
  STORY_LOOP_MS,
  getCaption,
  getFanDelayMs,
  getLiftsFor,
  getNavigation,
  getScreen,
  getScreenView,
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
    expect(STORY_BEATS.at(0)?.holdMs).toBe(getFanDelayMs(SIDE_CARDS.length - 1, true) + 200);
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

describe("getScreen", () => {
  it("shows New Plan for pasting and picking days", () => {
    expect(getScreen({ kind: "arrive" })).toBe("newPlan");
    expect(getScreen(onStage("plan"))).toBe("newPlan");
  });

  it("shows the study session for read, scripture, reflect, and pray", () => {
    expect(getScreen(onStage("read"))).toBe("study");
    expect(getScreen(onStage("scripture"))).toBe("study");
    expect(getScreen(onStage("pray"))).toBe("study");
  });

  it("shows Quick Check last, and while the stage leaves", () => {
    expect(getScreen(onStage("quiz"))).toBe("quiz");
    expect(getScreen({ kind: "leave" })).toBe("quiz");
  });
});

describe("getNavigation — as the real app moves", () => {
  it("starts on the first screen with no transition", () => {
    expect(getNavigation({ kind: "arrive" })).toBe("cut");
    expect(getNavigation(onStage("paste"))).toBe("cut");
  });

  it("steps within New Plan from pasting to picking days", () => {
    expect(getNavigation(onStage("plan"))).toBe("step");
  });

  it("presents the study session as a modal after Create my plan", () => {
    expect(getNavigation(onStage("read"))).toBe("modal");
  });

  it("steps within the study session from read to scripture to reflect to pray", () => {
    expect(getNavigation(onStage("scripture"))).toBe("step");
    expect(getNavigation(onStage("reflect"))).toBe("step");
    expect(getNavigation(onStage("pray"))).toBe("step");
  });

  it("pushes Quick Check", () => {
    expect(getNavigation(onStage("quiz"))).toBe("push");
  });
});

describe("getScreenView", () => {
  it("shows the screen on the phone at its current step, on the turn's clock", () => {
    expect(getScreenView("study", onStage("reflect"), 900)).toEqual({ step: 2, elapsedMs: 900 });
  });

  it("opens the study session on its Read step", () => {
    expect(getScreenView("study", onStage("read"), 900)).toEqual({ step: 0, elapsedMs: 900 });
  });

  it("arrives with the first screen at its start", () => {
    expect(getScreenView("newPlan", { kind: "arrive" }, 900)).toEqual({ step: 0, elapsedMs: 0 });
  });

  it("shows a screen that's been left at its last step, finished", () => {
    expect(getScreenView("newPlan", onStage("read"), 900)).toEqual({
      step: 1,
      elapsedMs: Infinity,
    });
  });

  it("shows the last screen finished while the stage leaves", () => {
    expect(getScreenView("quiz", { kind: "leave" }, 0).elapsedMs).toBe(Infinity);
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

describe("getCaption", () => {
  it("shows no step until the first turn", () => {
    expect(getCaption({ kind: "arrive" })).toEqual({ mode: "hidden" });
  });

  it("shows the step the screen on the phone illustrates", () => {
    expect(getCaption(onStage("plan"))).toEqual({ mode: "step", step: 1, word: null });
  });

  it('has both reading steps, Read and Scripture, stand for "Read"', () => {
    expect(getCaption(onStage("read"))).toEqual({ mode: "step", step: 2, word: 0 });
    expect(getCaption(onStage("scripture"))).toEqual({ mode: "step", step: 2, word: 0 });
  });

  it("picks out the item of step 3 each study screen stands for", () => {
    expect(getCaption(onStage("pray"))).toEqual({ mode: "step", step: 2, word: 2 });
  });

  it("keeps the last step up while the stage fades out", () => {
    expect(getCaption({ kind: "leave" })).toEqual({ mode: "step", step: 2, word: 3 });
  });
});
