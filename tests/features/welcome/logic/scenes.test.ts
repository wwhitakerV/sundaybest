import {
  LIFT,
  LIFTED_AT_MS,
  PASTE_LINK,
  PASTE_SCENE,
  PRAYER_LINES,
  READ_WORDS,
  REFLECT_ANSWER,
  getLiftState,
  getPasteScene,
  getPlanEndsLine,
  getPlanScene,
  getPreviewScene,
  getPrayScene,
  getQuizScene,
  getReadScene,
  getReflectScene,
  getTurnMs,
} from "@/features/welcome/logic/scenes";

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

    expect(getTurnMs(SCENE_MS)).toBeGreaterThan(landed);
  });
});

describe("getPasteScene", () => {
  it("starts with an empty field and an untapped Paste button", () => {
    expect(getPasteScene(0)).toEqual({ tapped: false, typedChars: 0, complete: false });
  });

  it("only taps Paste once the field is up", () => {
    expect(PASTE_SCENE.tapAtMs).toBeGreaterThanOrEqual(LIFTED_AT_MS);
    expect(getPasteScene(PASTE_SCENE.tapAtMs)).toMatchObject({ tapped: true, typedChars: 0 });
  });

  it("fills the link in a character at a time", () => {
    const partway = PASTE_SCENE.typeFromMs + PASTE_SCENE.charMs * 5;

    expect(getPasteScene(partway).typedChars).toBe(5);
  });

  it("finishes with the whole link in", () => {
    expect(getPasteScene(Infinity)).toEqual({
      tapped: true,
      typedChars: PASTE_LINK.length,
      complete: true,
    });
  });
});

describe("getPlanScene", () => {
  it("starts with no day picked", () => {
    expect(getPlanScene(0)).toEqual({ selectedDay: null });
  });

  it("picks 3 days, then changes to 6", () => {
    expect(getPlanScene(LIFTED_AT_MS + 300).selectedDay).toBe(3);
    expect(getPlanScene(LIFTED_AT_MS + 850).selectedDay).toBe(6);
  });

  it("finishes with 6 days picked", () => {
    expect(getPlanScene(Infinity)).toEqual({ selectedDay: 6 });
  });
});

describe("getPlanEndsLine", () => {
  it("asks for a length before one is picked", () => {
    expect(getPlanEndsLine(null)).toBe("Pick how long your plan runs.");
  });

  it("says a 6-day plan ends right before next Sunday", () => {
    expect(getPlanEndsLine(6)).toBe("Ends Saturday, right before next Sunday.");
  });

  it("says which day a shorter plan ends", () => {
    expect(getPlanEndsLine(3)).toBe("Ends Wednesday.");
  });
});

describe("getPreviewScene", () => {
  it("taps into the sermon card once it's up", () => {
    expect(getPreviewScene(0).tapped).toBe(false);
    expect(getPreviewScene(Infinity).tapped).toBe(true);
  });
});

describe("getReadScene", () => {
  it("lights the verse's words one after another, ending with all lit", () => {
    expect(getReadScene(0).litWords).toBe(0);
    expect(getReadScene(Infinity).litWords).toBe(READ_WORDS.length);
  });
});

describe("getReflectScene", () => {
  it("writes the whole answer out", () => {
    expect(getReflectScene(0).typedChars).toBe(0);
    expect(getReflectScene(Infinity).typedChars).toBe(REFLECT_ANSWER.length);
  });
});

describe("getPrayScene", () => {
  it("brings every line in by the end", () => {
    expect(getPrayScene(0).shownLines).toBe(0);
    expect(getPrayScene(Infinity).shownLines).toBe(PRAYER_LINES.length);
  });

  it("glows only while the prayer is up, not at rest", () => {
    expect(getPrayScene(0).glowing).toBe(false);
    expect(getPrayScene(LIFTED_AT_MS).glowing).toBe(true);
    expect(getPrayScene(Infinity).glowing).toBe(false);
  });
});

describe("getQuizScene", () => {
  it("picks an answer, then reveals it's right", () => {
    expect(getQuizScene(0)).toEqual({ picked: false, revealed: false });
    expect(getQuizScene(LIFTED_AT_MS + 350)).toEqual({ picked: true, revealed: false });
    expect(getQuizScene(Infinity)).toEqual({ picked: true, revealed: true });
  });
});
