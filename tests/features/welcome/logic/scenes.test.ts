import {
  PASTE_LINK,
  PASTE_SCENE,
  PRAYER_LINES,
  PRAY_SCENE,
  SCRIPTURE_WORDS,
  REFLECT_ANSWER,
  getCreateScene,
  getListenScene,
  LISTEN_SCENE,
  getPasteScene,
  getPlanScene,
  getFilledPerLine,
  getPrayScene,
  getQuizScene,
  getScriptureScene,
  getReflectScene,
} from "@/features/welcome/logic/scenes";
import { LIFTED_AT_MS } from "@/features/welcome/logic/lift-timing";

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

  it("picks a day once the days are up", () => {
    expect(getPlanScene(LIFTED_AT_MS + 299).selectedDay).toBeNull();
    expect(getPlanScene(LIFTED_AT_MS + 300).selectedDay).toBe(6);
  });

  it("finishes with 6 days picked", () => {
    expect(getPlanScene(Infinity)).toEqual({ selectedDay: 6 });
  });
});

describe("getCreateScene", () => {
  it("presses Create my plan after the day is picked", () => {
    expect(getCreateScene(LIFTED_AT_MS + 300).pressed).toBe(false);
    expect(getCreateScene(Infinity).pressed).toBe(true);
  });
});

describe("getListenScene", () => {
  it("waits to be played, showing where this part of the sermon starts", () => {
    expect(getListenScene(0)).toEqual({ playing: false, clock: "18:42" });
  });

  it("plays once pressed, from 18:42", () => {
    expect(getListenScene(LISTEN_SCENE.pressAtMs)).toEqual({ playing: true, clock: "18:42" });
  });

  it("ticks the sermon's clock on as it plays", () => {
    expect(getListenScene(LISTEN_SCENE.pressAtMs + 1000).clock).toBe("18:43");
  });

  it("stops ticking where the scene ends", () => {
    expect(getListenScene(Infinity).clock).toBe("18:43");
  });
});

describe("getScriptureScene", () => {
  it("lights the verse's words one after another, ending with all lit", () => {
    expect(getScriptureScene(0).litWords).toBe(0);
    expect(getScriptureScene(Infinity).litWords).toBe(SCRIPTURE_WORDS.length);
  });
});

describe("getReflectScene", () => {
  it("writes the whole answer out", () => {
    expect(getReflectScene(0).typedChars).toBe(0);
    expect(getReflectScene(Infinity).typedChars).toBe(REFLECT_ANSWER.length);
  });
});

describe("getPrayScene", () => {
  it("starts with none of the prayer filled, and ends with all of it", () => {
    const total = PRAYER_LINES.join("").length;

    expect(getPrayScene(0).filledChars).toBe(0);
    expect(getPrayScene(Infinity).filledChars).toBe(total);
  });

  it("finishes filling before the prayer goes back down", () => {
    const total = PRAYER_LINES.join("").length;

    expect(getPrayScene(LIFTED_AT_MS + PRAY_SCENE.sceneMs).filledChars).toBe(total);
  });
});

describe("getFilledPerLine", () => {
  it("fills the lines in order, finishing each before starting the next", () => {
    const first = PRAYER_LINES[0]?.length ?? 0;

    expect(getFilledPerLine(first + 3)).toEqual([first, 3, 0, 0]);
  });
});

describe("getQuizScene", () => {
  it("picks an answer, then reveals it's right", () => {
    expect(getQuizScene(0)).toEqual({ picked: false, revealed: false });
    expect(getQuizScene(LIFTED_AT_MS + 350)).toEqual({ picked: true, revealed: false });
    expect(getQuizScene(Infinity)).toEqual({ picked: true, revealed: true });
  });
});
