/** Design tokens. Every colour has a light and a dark value. */

import { fonts } from "./fonts";

const palette = {
  white: "#FFFFFF",
  ink900: "#10131A",
  ink600: "#4A5160",
  ink300: "#9AA1B1",
  paper: "#F7F8FA",
  slate900: "#0B0D12",
  slate700: "#171A21",
  accent: "#D62626",
  lightIcon: "#d2d2d0",
  // Brand palette. Fixed values, not theme-dependent — same as `accent`
  // above, these read the same in light and dark. More colours land here as
  // they're specified; this is not yet the full set.
  black: "#08090A",
  red: "#D62626",
  green: "#1FD19B",
  darkgrey: "#55555D",
  grey: "#8A8A92",
  greyLightest: "#F7F1F1",
  // Navigation-chrome ink. Close to but distinct from `black` above — the
  // header/title/icon spec calls for this exact value, not the brand black.
  ink: "#111113",
  // Overlay tints used by header icon buttons, the tab bar, and segmented
  // controls in the light theme — black-on-white, per spec.
  hairline: "rgba(0, 0, 0, 0.06)",
  overlaySubtle: "rgba(0, 0, 0, 0.03)",
  overlayMedium: "rgba(0, 0, 0, 0.09)",
  overlayStrong: "rgba(0, 0, 0, 0.10)",
  // The same overlays, inverted for a dark background. The spec only gives
  // light-mode values; these keep the same relative opacities on white
  // instead of black so the chrome remains visible in dark mode.
  hairlineOnDark: "rgba(255, 255, 255, 0.12)",
  overlaySubtleOnDark: "rgba(255, 255, 255, 0.06)",
  overlayMediumOnDark: "rgba(255, 255, 255, 0.16)",
  overlayStrongOnDark: "rgba(255, 255, 255, 0.18)",
  // The Daily Study step labels (Read/Scripture/Reflect/Pray) beneath the
  // progress lines. Pure black per spec — distinct from `black` above,
  // which is the app's near-black brand value, not literal #000.
  pureBlack: "#000000",
  stepLabelInactive: "#A1A1AA",
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
  lightIcon: string;
  /** Secondary text: the quieter half of a heading, supporting copy, footnotes. */
  textMuted: string;
  /** Inactive items in a strip or set. Darker than `textMuted`. */
  textInactive: string;
  border: string;
  /** Hairline rules between list rows. Lighter than `border`. */
  divider: string;
  accent: string;
  /** Filled primary controls — the button fill, not the page background. */
  controlPrimary: string;
  /** Text and icons sitting on `controlPrimary`. */
  onControlPrimary: string;
  /** The active item in a selector or strip. */
  selected: string;
  /** Header/tab-bar icon colour, and the centered nav-title's active state. */
  chromeIcon: string;
  /** The centered header title's own colour — quieter than `chromeIcon`. */
  chromeTitle: string;
  /** The right-aligned step counter in a header ("1 of 2"). */
  chromeStepCounter: string;
  /** The 1px border on header icon buttons and the floating tab bar. */
  hairline: string;
  /** A segmented control's unselected track. */
  segmentBackground: string;
  /** A segmented control's selected segment. */
  segmentActiveBackground: string;
  /** An active tab's background pill inside the floating tab bar. */
  tabActiveBackground: string;
  /** The Daily Study step label (Read/Scripture/Reflect/Pray) for the current step. */
  stepLabelActive: string;
  /** A Daily Study step label for a completed or upcoming step — same grey either way. */
  stepLabelInactive: string;
};

const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.paper,
  text: palette.black,
  textMuted: palette.grey,
  textInactive: palette.darkgrey,
  border: palette.ink300,
  divider: palette.greyLightest,
  accent: palette.accent,
  controlPrimary: palette.black,
  onControlPrimary: palette.white,
  lightIcon: palette.lightIcon,
  selected: palette.green,
  chromeIcon: palette.ink,
  chromeTitle: palette.darkgrey,
  chromeStepCounter: palette.grey,
  hairline: palette.hairline,
  segmentBackground: palette.overlaySubtle,
  segmentActiveBackground: palette.overlayMedium,
  tabActiveBackground: palette.overlayStrong,
  stepLabelActive: palette.pureBlack,
  stepLabelInactive: palette.stepLabelInactive,
};

const darkColors: ColorTokens = {
  background: palette.slate900,
  surface: palette.slate700,
  text: palette.white,
  textMuted: palette.grey,
  textInactive: palette.darkgrey,
  border: palette.ink600,
  divider: palette.slate700,
  accent: palette.accent,
  controlPrimary: palette.white,
  onControlPrimary: palette.black,
  lightIcon: palette.lightIcon,
  selected: palette.green,
  chromeIcon: palette.white,
  chromeTitle: palette.grey,
  chromeStepCounter: palette.grey,
  hairline: palette.hairlineOnDark,
  segmentBackground: palette.overlaySubtleOnDark,
  segmentActiveBackground: palette.overlayMediumOnDark,
  tabActiveBackground: palette.overlayStrongOnDark,
  stepLabelActive: palette.white,
  stepLabelInactive: palette.grey,
};

/**
 * Scales are reached through the theme (`theme.spacing.md`) rather than imported
 * directly, so they stay module-local and there is one way to read a token.
 */
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

const radii = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

/**
 * `fontFamily` keys reference `src/theme/fonts.ts`'s custom-loaded faces.
 * Roles with no `fontFamily` intentionally fall back to the system font
 * (SF Pro on iOS) — it isn't a bundled asset, so it's a `fontWeight` alone.
 *
 * Sizes are fixed, not scaled at runtime. The design spec is drawn at a 320px
 * reference width; each value here is that spec multiplied by 1.228125 (the
 * 393pt baseline) and rounded once, so a 320px comp reads at its intended
 * presence without any width-derived scaling. Smaller and larger devices keep
 * these same absolute values and adapt through layout, not type size.
 */
const typography = {
  masthead: { fontFamily: fonts.masthead, fontSize: 18, fontWeight: "400" },
  editorialHeading: { fontFamily: fonts.editorialHeading, fontSize: 20, fontWeight: "500" },
  editorialBody: { fontFamily: fonts.editorialBody, fontSize: 16, fontWeight: "400" },
  metaLabel: { fontFamily: fonts.metaLabel, fontSize: 13, fontWeight: "500" },
  metaBody: { fontFamily: fonts.metaBody, fontSize: 13, fontWeight: "400" },
  metaEmphasis: { fontFamily: fonts.metaEmphasis, fontSize: 11, fontWeight: "600" },
  body: { fontSize: 17, fontWeight: "400" },
  label: { fontSize: 14, fontWeight: "500" },
  headline: { fontSize: 24, fontWeight: "700" },

  /** Hero sentence. Spec 30/500/1.06/-0.03em. */
  display: { fontSize: 37, fontWeight: "500", lineHeight: 39, letterSpacing: -1.11 },
  /** The static weekday strip. Spec 17/-0.01em, IBM Plex Mono Medium. */
  dayStrip: { fontFamily: fonts.metaLabel, fontSize: 21, fontWeight: "500", letterSpacing: -0.21 },
  /** Supporting copy and footnotes. Spec 11/1.45/0.02em, IBM Plex Mono. */
  supporting: {
    fontFamily: fonts.metaBody,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0.28,
  },
  /** Feature-row labels. Spec 13.5. */
  listItem: { fontSize: 17, fontWeight: "500" },
  /** Button labels, both variants. Spec 15/-0.01em. */
  button: { fontSize: 18, fontWeight: "600" },

  /** Centered header title ("New plan", "Day 2 of 6", "Quick check"). Spec 14/500. */
  navTitle: { fontSize: 17, fontWeight: "500" },
  /** Top-level tab-root titles (Plans, Progress, Settings). Spec 24/500/1.12/-0.02em. */
  screenTitle: { fontSize: 29, fontWeight: "500", lineHeight: 32, letterSpacing: -0.58 },
  /** A header's right-aligned step count ("1 of 2"). Spec 11 mono/0.02em. */
  stepCounter: { fontFamily: fonts.metaBody, fontSize: 14, fontWeight: "400", letterSpacing: 0.28 },
  /** A segmented control's option label. Spec 12.5/400. */
  segmentLabel: { fontSize: 15, fontWeight: "400" },
  /** A borderless filter-tabs label (Plans' All/In progress/Done/Saved row). Spec 13/400. */
  filterLabel: { fontSize: 16, fontWeight: "400" },
  /** A filter tab's superscript count. Spec 9pt. */
  filterCount: { fontSize: 11, fontWeight: "400" },
  /** A Daily Study step label (Read/Scripture/Reflect/Pray) below the progress line. */
  stepLabel: { fontSize: 13, fontWeight: "400", lineHeight: 16 },
} as const;

export const lightTheme = {
  name: "light",
  colors: lightColors,
  palette,
  spacing,
  radii,
  typography,
} as const;

/**
 * Not read by `useTheme()` right now — dark mode is a deliberate future
 * feature with its own design, not a response to the OS colour scheme (see
 * `use-theme.ts`). Kept defined rather than deleted so the values exist when
 * that work starts.
 *
 * @public
 */
export const darkTheme = {
  name: "dark",
  colors: darkColors,
  palette,
  spacing,
  radii,
  typography,
} as const;

export type Theme = typeof lightTheme | typeof darkTheme;
