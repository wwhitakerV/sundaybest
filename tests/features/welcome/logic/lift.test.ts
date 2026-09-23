import { getLiftLayout } from "@/features/welcome/logic/lift";

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
