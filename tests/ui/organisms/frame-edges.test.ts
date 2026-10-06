import { EDGE_FADE, GRADUAL_FADE, GRADUAL_RAMP, getFrameEdges } from "@/ui/organisms/frame-edges";
import {
  getFloatingNavBarBottom,
  getFloatingNavBarTintHeight,
} from "@/ui/organisms/floatingNavBar";
import { PAGE_TOP } from "@/ui/organisms/Screen";

const insets = { insetTop: 59, insetBottom: 34 };

describe("getFrameEdges", () => {
  describe("the top edge", () => {
    it("is solid over a header, and fades out just below it", () => {
      const { top } = getFrameEdges({ ...insets, headerHeight: 120, foot: { kind: "none" } });

      expect(top).toEqual({ solid: 120, height: 120 + EDGE_FADE, clearance: 120 + EDGE_FADE });
    });

    it("without a header, is solid over the status bar and fades below it, content where the page top was", () => {
      const { top } = getFrameEdges({ ...insets, headerHeight: 0, foot: { kind: "none" } });

      expect(top).toEqual({ solid: 59, height: 59 + EDGE_FADE, clearance: 59 + PAGE_TOP });
    });
  });

  describe("a gradual top edge", () => {
    it("fades within the header's own block, ending at its bottom edge, content just below", () => {
      const { top } = getFrameEdges({
        ...insets,
        headerHeight: 160,
        headerFade: "gradual",
        foot: { kind: "none" },
      });

      expect(top).toEqual({ solid: 160 - GRADUAL_FADE, height: 160, clearance: 160 });
    });

    it("is thicker than the dock's fade", () => {
      expect(GRADUAL_FADE).toBeGreaterThan(EDGE_FADE);
    });

    it("eases out from solid to clear, never in a straight band", () => {
      const opacities = GRADUAL_RAMP.map((stop) => stop.opacity);

      expect(GRADUAL_RAMP[0]).toEqual({ at: 0, opacity: 1 });
      expect(GRADUAL_RAMP.at(-1)).toEqual({ at: 1, opacity: 0 });
      expect([...opacities].sort((a, b) => b - a)).toEqual(opacities);
      expect(GRADUAL_RAMP.length).toBeGreaterThan(2);
    });
  });

  describe("a soft top edge, over a header's last row", () => {
    const { top } = getFrameEdges({
      ...insets,
      headerHeight: 150,
      headerFade: { kind: "soft", reach: 36 },
      foot: { kind: "none" },
    });

    it("is solid until 10pt above the row, and fully clear 10pt past the header's edge", () => {
      expect(top.solid).toBe(150 - 36 - 10);
      expect(top.height).toBe(150 + 10);
    });

    it("starts the content where the fade has cleared", () => {
      expect(top.clearance).toBe(160);
    });

    it("is 80% clear at the header's bottom edge", () => {
      const edge = (36 + 10) / (36 + 20);
      expect(top.ramp).toContainEqual({ at: edge, opacity: 0.2 });
      expect(top.ramp?.[0]).toEqual({ at: 0, opacity: 1 });
      expect(top.ramp?.at(-1)).toEqual({ at: 1, opacity: 0 });
    });
  });

  describe("the bottom edge", () => {
    it("with a dock, is exactly the tab bar's tint: solid below the pill, fading 16pt above it", () => {
      const { bottom } = getFrameEdges({ ...insets, headerHeight: 0, foot: { kind: "dock" } });
      const capsuleBottom = getFloatingNavBarBottom(34);
      const tint = getFloatingNavBarTintHeight(capsuleBottom);

      expect(bottom).toEqual({ solid: capsuleBottom, height: tint, clearance: tint });
    });

    it("with a verdict panel, is solid behind the panel and fades above it", () => {
      const { bottom } = getFrameEdges({
        ...insets,
        headerHeight: 0,
        foot: { kind: "panel", height: 200 },
      });

      expect(bottom).toEqual({ solid: 200, height: 200 + EDGE_FADE, clearance: 200 + EDGE_FADE });
    });

    it("with nothing at the foot, is solid under the home indicator and fades above it", () => {
      const { bottom } = getFrameEdges({ ...insets, headerHeight: 0, foot: { kind: "none" } });

      expect(bottom).toEqual({ solid: 34, height: 34 + EDGE_FADE, clearance: 34 + EDGE_FADE });
    });
  });

  it("fades the top and the bottom over the same distance as the tab bar does", () => {
    expect(EDGE_FADE).toBe(16);
  });
});
