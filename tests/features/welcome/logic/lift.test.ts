import { getLiftLayout, getScrollToReveal, getScrollToShow } from "@/features/welcome/logic/lift";

const OPTIONS = {
  anchor: { x: 36, y: 300, width: 345, height: 74 },
  card: { x: 46, y: 14, scale: 0.72 },
  stageWidth: 393,
  bottom: 200,
  minTop: 6,
  sidePadding: 8,
  cardPadding: 12,
  fade: { from: 250, to: 320 },
};

describe("getLiftLayout", () => {
  it("starts exactly over the piece's copy on the phone", () => {
    expect(getLiftLayout(OPTIONS).onPhone).toEqual({
      x: 46 + 36 * 0.72,
      y: 14 + 300 * 0.72,
      scale: 0.72,
    });
  });

  it("rests at exactly real size when it fits, so its text is sharp", () => {
    expect(getLiftLayout(OPTIONS).lifted.scale).toBe(1);
  });

  it("sits centred, its floating card's bottom on the line", () => {
    const { lifted } = getLiftLayout(OPTIONS);

    expect(lifted.x).toBeCloseTo((393 - 345) / 2);
    expect(lifted.y).toBeCloseTo(200 - 12 - 74);
  });

  it("shrinks a piece too tall for the stage, card and all", () => {
    const { lifted } = getLiftLayout({ ...OPTIONS, anchor: { ...OPTIONS.anchor, height: 250 } });

    expect(lifted.scale).toBeCloseTo((200 - 6 - 24) / 250);
    expect(lifted.y - 12).toBeCloseTo(6);
  });

  it("shrinks a piece too wide for a narrow screen, keeping clear space either side", () => {
    const { lifted } = getLiftLayout({ ...OPTIONS, stageWidth: 360 });

    expect(lifted.scale).toBeCloseTo((360 - 16 - 24) / 345);
    expect(lifted.x - 12).toBeCloseTo(8);
  });

  it("matches the phone's copy where the phones are still clear", () => {
    const high = getLiftLayout({ ...OPTIONS, anchor: { ...OPTIONS.anchor, y: 200 } });

    expect(high.onPhoneOpacity).toBe(1);
  });

  it("starts faded where the phone's copy sits in the fade", () => {
    const low = getLiftLayout({ ...OPTIONS, anchor: { ...OPTIONS.anchor, y: 360 } });

    expect(low.onPhoneOpacity).toBeGreaterThan(0);
    expect(low.onPhoneOpacity).toBeLessThan(1);
  });

  it("starts invisible where the phone's copy is already white", () => {
    const hidden = getLiftLayout({ ...OPTIONS, anchor: { ...OPTIONS.anchor, y: 500 } });

    expect(hidden.onPhoneOpacity).toBe(0);
  });
});

describe("getScrollToShow", () => {
  const WINDOW = { contentTop: 100, maxScroll: 500, topMargin: 20 };

  it("brings the piece's top to just below the top of the scrolling area", () => {
    const anchor = { x: 0, y: 500, width: 300, height: 60 };

    expect(getScrollToShow(anchor, WINDOW)).toBe(500 - 100 - 20);
  });

  it("doesn't scroll a piece that's already near the top", () => {
    expect(getScrollToShow({ x: 0, y: 120, width: 300, height: 40 }, WINDOW)).toBe(0);
  });

  it("never scrolls past the end of the page", () => {
    expect(getScrollToShow({ x: 0, y: 2000, width: 300, height: 60 }, WINDOW)).toBe(500);
  });
});

describe("getScrollToReveal", () => {
  const WINDOW = { visibleBottom: 400, bottomMargin: 24 };

  it("scrolls just far enough to bring the piece above the bottom of the view", () => {
    const anchor = { x: 0, y: 500, width: 300, height: 80 };

    expect(getScrollToReveal(anchor, WINDOW)).toBe(500 + 80 + 24 - 400);
  });

  it("doesn't scroll a piece that's already in view", () => {
    expect(getScrollToReveal({ x: 0, y: 200, width: 300, height: 80 }, WINDOW)).toBe(0);
  });
});
