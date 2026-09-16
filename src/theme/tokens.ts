/** Design tokens. Every colour has a light and a dark value. */

const palette = {
  white: "#FFFFFF",
  ink900: "#10131A",
  ink600: "#4A5160",
  ink300: "#9AA1B1",
  paper: "#F7F8FA",
  slate900: "#0B0D12",
  slate700: "#171A21",
  accent: "#3D6DF5",
} as const;

/**
 * Widened to `string` on purpose: annotating both palettes with the same shape
 * is what makes them interchangeable. Typing `darkColors` as
 * `typeof lightColors` instead would infer the *literal* light hex values and
 * reject every dark one.
 */
type ColorTokens = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
};

const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.paper,
  text: palette.ink900,
  textMuted: palette.ink600,
  border: palette.ink300,
  accent: palette.accent,
};

const darkColors: ColorTokens = {
  background: palette.slate900,
  surface: palette.slate700,
  text: palette.white,
  textMuted: palette.ink300,
  border: palette.ink600,
  accent: palette.accent,
};

/**
 * Scales are reached through the theme (`theme.spacing.md`) rather than imported
 * directly, so they stay module-local and there is one way to read a token.
 */
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

const radii = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

const typography = {
  title: { fontSize: 24, fontWeight: "600" },
  body: { fontSize: 16, fontWeight: "400" },
  caption: { fontSize: 13, fontWeight: "400" },
} as const;

export const lightTheme = {
  name: "light",
  colors: lightColors,
  spacing,
  radii,
  typography,
} as const;

export const darkTheme = {
  name: "dark",
  colors: darkColors,
  spacing,
  radii,
  typography,
} as const;

export type Theme = typeof lightTheme | typeof darkTheme;
