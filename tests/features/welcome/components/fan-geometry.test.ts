import { BUILD_WIDTH, TOP_PAD, getStageGeometry } from "@/features/welcome/components/fan-geometry";

describe("getStageGeometry", () => {
  const geometry = getStageGeometry(393, 280);

  it("centres the phone on stage and keeps its top clear of the stage edge", () => {
    expect(geometry.mainCard.x).toBeCloseTo((393 - BUILD_WIDTH) / 2);
    expect(geometry.mainCard.y).toBe(TOP_PAD);
    expect(TOP_PAD).toBeGreaterThan(0);
  });

  it("turns the phones fully white before the caption starts", () => {
    const captionTop = 280 - geometry.caption.bottom - geometry.caption.height;

    expect(geometry.fade.to).toBeLessThan(captionTop);
  });

  it("covers everything below the fade with solid white, down to the edge", () => {
    expect(geometry.fadeLayer.height - geometry.fadeLayer.solidHeight).toBeCloseTo(
      geometry.fade.to - geometry.fade.from,
    );
  });

  it("keeps the lifted card above the caption", () => {
    const captionTop = 280 - geometry.caption.bottom - geometry.caption.height;

    expect(geometry.liftBottom).toBeLessThan(captionTop);
  });

  it("runs the progress line between the lifted card and the caption, in the white", () => {
    const captionTop = 280 - geometry.caption.bottom - geometry.caption.height;
    const progressTop = 280 - geometry.progress.bottom;

    expect(progressTop).toBeLessThan(captionTop);
    expect(progressTop).toBeGreaterThan(geometry.liftBottom);
    expect(progressTop).toBeGreaterThanOrEqual(geometry.fade.to);
  });

  it("gives a taller stage more room for the lifted card", () => {
    expect(getStageGeometry(393, 400).liftBottom).toBeGreaterThan(geometry.liftBottom);
  });
});
