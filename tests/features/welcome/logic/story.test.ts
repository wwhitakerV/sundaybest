import { getTurnMs } from "@/features/welcome/logic/scenes";
import {
  STAGE_FADE,
  STORY_BEATS,
  STORY_CARDS,
  getCaption,
  getCardPose,
  getPoseDurationMs,
  getSceneMode,
  getSceneMsFor,
  isStageShown,
  type StoryPhase,
} from "@/features/welcome/logic/story";

const STAGE = { restScale: 0.4, supportOpacity: 0.5 };
const LAST = STORY_CARDS.length - 1;
const onStage = (card: (typeof STORY_CARDS)[number]["key"]): StoryPhase => ({
  kind: "focus",
  card,
});

describe("STORY_BEATS", () => {
  it("arrives first and leaves last, looping between", () => {
    expect(STORY_BEATS.at(0)?.phase).toEqual({ kind: "arrive" });
    expect(STORY_BEATS.at(-1)?.phase).toEqual({ kind: "leave" });
  });

  it("waits a breath after the stage has faded in before the first turn", () => {
    expect(STORY_BEATS.at(0)?.holdMs).toBe(STAGE_FADE.inMs + 200);
  });

  it("gives every card one turn, in deck order", () => {
    const turns = STORY_BEATS.flatMap(({ phase }) => (phase.kind === "focus" ? [phase.card] : []));

    expect(turns).toEqual(STORY_CARDS.map((card) => card.key));
  });

  it("holds each card's turn long enough for its lift and scene", () => {
    const pasteTurn = STORY_BEATS.find(
      ({ phase }) => phase.kind === "focus" && phase.card === "paste",
    );

    expect(pasteTurn?.holdMs).toBe(getTurnMs(getSceneMsFor("paste")));
  });

  it("lets the stage finish fading out before it comes back", () => {
    expect(STORY_BEATS.at(-1)?.holdMs).toBeGreaterThan(STAGE_FADE.outMs);
  });
});

describe("isStageShown", () => {
  it("shows the stage from arriving through the last turn, and hides it to leave", () => {
    expect(isStageShown({ kind: "arrive" })).toBe(true);
    expect(isStageShown(onStage("quiz"))).toBe(true);
    expect(isStageShown({ kind: "leave" })).toBe(false);
  });
});

describe("getCardPose", () => {
  it("arrives with the first card already on stage as the big phone", () => {
    expect(getCardPose(0, { kind: "arrive" }, STAGE)).toMatchObject({
      rotateDeg: 0,
      scale: 1,
      opacity: 1,
      zIndex: 200,
    });
  });

  it("never shows a closed deck or a full spread: one card is always on stage", () => {
    const phases: StoryPhase[] = [
      { kind: "arrive" },
      ...STORY_CARDS.map((card) => onStage(card.key)),
      { kind: "leave" },
    ];

    for (const phase of phases) {
      const bigPhones = STORY_CARDS.filter(
        (_, index) => getCardPose(index, phase, STAGE).scale === 1,
      );
      expect(bigPhones).toHaveLength(1);
    }
  });

  it("leaves with the last card still on stage", () => {
    expect(getCardPose(LAST, { kind: "leave" }, STAGE).scale).toBe(1);
  });

  it("snaps into place on arriving, while the stage is invisible", () => {
    expect(getPoseDurationMs({ kind: "arrive" })).toBe(0);
    expect(getPoseDurationMs(onStage("plan"))).toBeGreaterThan(0);
  });

  it("fans cards that have had their turn out to the left, small and dimmed", () => {
    expect(getCardPose(0, onStage("plan"), STAGE)).toMatchObject({ scale: 0.4, opacity: 0.5 });
    expect(getCardPose(0, onStage("plan"), STAGE).rotateDeg).toBeLessThan(0);
  });

  it("fans cards still to come out to the right", () => {
    expect(getCardPose(2, onStage("plan"), STAGE).rotateDeg).toBeGreaterThan(0);
  });

  it("fans cards further the further they are from their turn, hiding the far ones", () => {
    const next = getCardPose(4, onStage("read"), STAGE);
    const afterThat = getCardPose(5, onStage("read"), STAGE);
    const farAway = getCardPose(6, onStage("read"), STAGE);

    expect(afterThat.rotateDeg).toBeGreaterThan(next.rotateDeg);
    expect(farAway.opacity).toBe(0);
  });

  it("stacks the cards around the stage below the one on it, nearest on top", () => {
    const main = getCardPose(3, onStage("read"), STAGE);
    const near = getCardPose(2, onStage("read"), STAGE);
    const far = getCardPose(1, onStage("read"), STAGE);

    expect(main.zIndex).toBeGreaterThan(near.zIndex);
    expect(near.zIndex).toBeGreaterThan(far.zIndex);
  });
});

describe("getSceneMode", () => {
  it("arrives with nothing playing yet", () => {
    expect(getSceneMode(0, { kind: "arrive" })).toBe("before");
  });

  it("plays the card on stage, and leaves earlier ones finished", () => {
    expect(getSceneMode(1, onStage("plan"))).toBe("play");
    expect(getSceneMode(0, onStage("plan"))).toBe("after");
    expect(getSceneMode(2, onStage("plan"))).toBe("before");
  });

  it("leaves with every scene finished", () => {
    expect(getSceneMode(LAST, { kind: "leave" })).toBe("after");
  });
});

describe("getCaption", () => {
  it("shows no step until the first turn", () => {
    expect(getCaption({ kind: "arrive" })).toEqual({ mode: "hidden" });
  });

  it("shows the step the card on stage illustrates", () => {
    expect(getCaption(onStage("plan"))).toEqual({ mode: "step", step: 1, word: null });
  });

  it("keeps step 2's caption up while the sermon card is tapped into", () => {
    expect(getCaption(onStage("preview"))).toEqual({ mode: "step", step: 1, word: null });
  });

  it("picks out the item of step 3 each of its screens stands for", () => {
    expect(getCaption(onStage("pray"))).toEqual({ mode: "step", step: 2, word: 2 });
  });

  it("keeps the last step up while the stage fades out", () => {
    expect(getCaption({ kind: "leave" })).toEqual({ mode: "step", step: 2, word: 3 });
  });
});
