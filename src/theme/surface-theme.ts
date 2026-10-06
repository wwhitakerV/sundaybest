import type { Theme } from "./tokens";

/**
 * A surface laid down in a control's own colour, whole: `"primary"` is the
 * primary control's (black in light mode), `"success"` the ready green.
 */
export type Surface = "primary" | "success";

/**
 * The theme for everything sitting on a solid `surface`: its colour as the
 * page, its ink as the text, its faint ink for lines and tracks, and the
 * primary button turned over so it still stands out. Scope a region with it
 * (`ThemeScope`) and every button, line, spinner and word in it follows —
 * the generation sheet, dark while building and green once ready.
 *
 * Built once per base theme and surface, so a scope's theme is the same
 * object from render to render.
 */
export function getSurfaceTheme(base: Theme, surface: Surface): Theme {
  let byBase = SURFACE_THEMES.get(base);
  if (!byBase) {
    byBase = new Map();
    SURFACE_THEMES.set(base, byBase);
  }
  const cached = byBase.get(surface);
  if (cached) return cached;

  const built = buildSurfaceTheme(base, surface);
  byBase.set(surface, built);
  return built;
}

const SURFACE_THEMES = new WeakMap<Theme, Map<Surface, Theme>>();

function buildSurfaceTheme(base: Theme, surface: Surface): Theme {
  const c = base.colors;
  // On the whole green, the words, marks, and button are bright white; the
  // red accent would clash, so marks take that white too.
  const ink =
    surface === "success"
      ? {
          fill: c.success,
          text: c.onSuccessBright,
          muted: c.onSuccessBright,
          faint: c.onSuccessFaint,
        }
      : {
          fill: c.controlPrimary,
          text: c.onControlPrimary,
          muted: c.onControlPrimaryMuted,
          faint: c.onControlPrimaryFaint,
        };
  const accent = surface === "success" ? { accent: ink.text, onAccent: ink.fill } : {};

  return {
    ...base,
    colors: {
      ...c,
      background: ink.fill,
      text: ink.text,
      textMuted: ink.muted,
      chromeIcon: ink.text,
      divider: ink.faint,
      hairline: ink.faint,
      containerBorder: ink.faint,
      progressTrack: ink.faint,
      sequenceLine: ink.faint,
      controlPrimary: ink.text,
      // The turned-over button's label: the fill's colour, but dark on the green.
      onControlPrimary: surface === "success" ? c.onSuccess : ink.fill,
      onControlPrimaryMuted: ink.muted,
      onControlPrimaryFaint: ink.faint,
      ...accent,
    },
  };
}
