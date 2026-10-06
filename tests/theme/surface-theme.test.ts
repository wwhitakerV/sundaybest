import { getSurfaceTheme } from "@/theme/surface-theme";
import { darkTheme, lightTheme } from "@/theme/tokens";

describe("getSurfaceTheme", () => {
  describe("the primary control's surface", () => {
    const surface = getSurfaceTheme(lightTheme, "primary").colors;
    const base = lightTheme.colors;

    it("lays the primary control's colour down as the page, its ink as the text", () => {
      expect(surface.background).toBe(base.controlPrimary);
      expect(surface.text).toBe(base.onControlPrimary);
      expect(surface.textMuted).toBe(base.onControlPrimaryMuted);
    });

    it("draws its lines and tracks faintly in its ink", () => {
      expect(surface.divider).toBe(base.onControlPrimaryFaint);
      expect(surface.progressTrack).toBe(base.onControlPrimaryFaint);
      expect(surface.sequenceLine).toBe(base.onControlPrimaryFaint);
    });

    it("turns its primary button over, so it stands out on the surface", () => {
      expect(surface.controlPrimary).toBe(base.onControlPrimary);
      expect(surface.onControlPrimary).toBe(base.controlPrimary);
    });

    it("keeps the accent", () => {
      expect(surface.accent).toBe(base.accent);
    });

    it("follows the base theme's own primary control in dark mode", () => {
      expect(getSurfaceTheme(darkTheme, "primary").colors.background).toBe(
        darkTheme.colors.controlPrimary,
      );
    });
  });

  describe("the success surface", () => {
    const surface = getSurfaceTheme(lightTheme, "success").colors;
    const base = lightTheme.colors;

    it("lays the green down as the page, with bright white words on it", () => {
      expect(surface.background).toBe(base.success);
      expect(surface.text).toBe(base.onSuccessBright);
    });

    it("draws marks, the accent, and the primary button in that white, the button's label dark", () => {
      expect(surface.accent).toBe(base.onSuccessBright);
      expect(surface.onAccent).toBe(base.success);
      expect(surface.controlPrimary).toBe(base.onSuccessBright);
      expect(surface.onControlPrimary).toBe(base.onSuccess);
    });
  });
});
