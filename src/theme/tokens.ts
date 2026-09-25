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
  overlayLight: "rgba(0, 0, 0, 0.08)",
  overlayMedium: "rgba(0, 0, 0, 0.09)",
  overlayStrong: "rgba(0, 0, 0, 0.10)",
  // The same overlays, inverted for a dark background. The spec only gives
  // light-mode values; these keep the same relative opacities on white
  // instead of black so the chrome remains visible in dark mode.
  hairlineOnDark: "rgba(255, 255, 255, 0.12)",
  overlaySubtleOnDark: "rgba(255, 255, 255, 0.06)",
  overlayMediumOnDark: "rgba(255, 255, 255, 0.16)",
  overlayStrongOnDark: "rgba(255, 255, 255, 0.18)",
  // Darkening laid over video thumbnails, under their play button and time.
  scrim: "rgba(0, 0, 0, 0.45)",
  // Quick Check's verdicts: a deep green for right and the brand red for
  // wrong, each with a soft tint to fill and a lighter line to edge it.
  correctInk: "#2E8A5E",
  correctMist: "#EEF6F1",
  correctLine: "#A9D3BC",
  incorrectMist: "#FBEDED",
  incorrectLine: "#EFB7B7",
  correctMistOnDark: "#16261E",
  correctLineOnDark: "#2F5A44",
  incorrectMistOnDark: "#2A1616",
  incorrectLineOnDark: "#6B2A2A",
  // Type and marks on a colour of the content's own (a featured sermon's):
  // white on a dark one, black on a light one, each full, muted, and faint.
  whiteMuted: "rgba(255, 255, 255, 0.72)",
  whiteFaint: "rgba(255, 255, 255, 0.28)",
  blackMuted: "rgba(8, 9, 10, 0.6)",
  blackFaint: "rgba(8, 9, 10, 0.18)",
  // A floating button's fill over content's own colour: dark on a dark
  // colour, light on a light one — so it sits in, not on.
  blackVeil: "rgba(8, 9, 10, 0.5)",
  whiteVeil: "rgba(255, 255, 255, 0.85)",
  // A soft halo behind words set over a picture, keeping them readable.
  blackHalo: "rgba(0, 0, 0, 0.35)",
  whiteHalo: "rgba(255, 255, 255, 0.5)",
  // A see-through rim around a floating card: the page, frosted.
  frost: "rgba(255, 255, 255, 0.6)",
  frostOnDark: "rgba(11, 13, 18, 0.6)",
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
  /** A heavier edge, for a control that should stand out from the chrome around it. */
  borderStrong: string;
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
  /** The bezel and camera island of a drawn phone (the Welcome screen's mock screens). */
  deviceFrame: string;
  /** Drop-shadow colour for raised surfaces; paired with `theme.elevation`. */
  shadow: string;
  /** Darkening over a video thumbnail, behind its play button and running time. */
  mediaScrim: string;
  /** Text and icons on `mediaScrim`. */
  onMediaScrim: string;
  /**
   * The see-through rim of a card floating over the page — the Welcome
   * story's lifted pieces. What's behind it shows through, faintly.
   */
  frostedRim: string;
  /** A right answer: its check, and the words saying so. */
  correct: string;
  /** Behind a right answer, and its verdict panel. */
  correctSurface: string;
  /** The edge of a right answer. */
  correctBorder: string;
  /** A wrong answer: its mark, and the words saying so. */
  incorrect: string;
  /** Behind a wrong answer, and its verdict panel. */
  incorrectSurface: string;
  /** The edge of a wrong answer. */
  incorrectBorder: string;
  /**
   * Type and marks on a colour of the content's own — a featured sermon's —
   * whatever the app's theme: `inkOnDark*` on a dark one, `inkOnLight*` on a
   * light one (`prefersLightInk` picks). Full, muted, and faint.
   */
  inkOnDark: string;
  inkOnDarkMuted: string;
  inkOnDarkFaint: string;
  inkOnLight: string;
  inkOnLightMuted: string;
  inkOnLightFaint: string;
  /** Behind featured content whose own colour isn't known yet. */
  featureBackdrop: string;
  /** A floating button's fill over a dark colour of the content's own (its icon `inkOnDark`). */
  overlayButtonDark: string;
  /** …and over a light one (its icon `inkOnLight`). */
  overlayButtonLight: string;
  /** The soft shadow behind light words set over a picture… */
  inkHaloOnDark: string;
  /** …and behind dark ones. */
  inkHaloOnLight: string;
};

const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.paper,
  text: palette.black,
  textMuted: palette.grey,
  textInactive: palette.darkgrey,
  border: palette.ink300,
  borderStrong: palette.darkgrey,
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
  tabActiveBackground: palette.overlayLight,
  stepLabelActive: palette.pureBlack,
  stepLabelInactive: palette.stepLabelInactive,
  deviceFrame: palette.ink,
  shadow: palette.pureBlack,
  mediaScrim: palette.scrim,
  onMediaScrim: palette.white,
  frostedRim: palette.frost,
  correct: palette.correctInk,
  correctSurface: palette.correctMist,
  correctBorder: palette.correctLine,
  incorrect: palette.red,
  incorrectSurface: palette.incorrectMist,
  incorrectBorder: palette.incorrectLine,
  inkOnDark: palette.white,
  inkOnDarkMuted: palette.whiteMuted,
  inkOnDarkFaint: palette.whiteFaint,
  inkOnLight: palette.black,
  inkOnLightMuted: palette.blackMuted,
  inkOnLightFaint: palette.blackFaint,
  featureBackdrop: palette.ink,
  overlayButtonDark: palette.blackVeil,
  overlayButtonLight: palette.whiteVeil,
  inkHaloOnDark: palette.blackHalo,
  inkHaloOnLight: palette.whiteHalo,
};

const darkColors: ColorTokens = {
  background: palette.slate900,
  surface: palette.slate700,
  text: palette.white,
  textMuted: palette.grey,
  textInactive: palette.darkgrey,
  border: palette.ink600,
  borderStrong: palette.grey,
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
  // A dark bezel on a dark page still reads as a phone by its lit screen.
  deviceFrame: palette.pureBlack,
  shadow: palette.pureBlack,
  // A thumbnail is dark or light on its own terms; the scrim reads the same.
  mediaScrim: palette.scrim,
  onMediaScrim: palette.white,
  frostedRim: palette.frostOnDark,
  correct: palette.correctInk,
  correctSurface: palette.correctMistOnDark,
  correctBorder: palette.correctLineOnDark,
  incorrect: palette.red,
  incorrectSurface: palette.incorrectMistOnDark,
  incorrectBorder: palette.incorrectLineOnDark,
  inkOnDark: palette.white,
  inkOnDarkMuted: palette.whiteMuted,
  inkOnDarkFaint: palette.whiteFaint,
  inkOnLight: palette.black,
  inkOnLightMuted: palette.blackMuted,
  inkOnLightFaint: palette.blackFaint,
  featureBackdrop: palette.ink,
  overlayButtonDark: palette.blackVeil,
  overlayButtonLight: palette.whiteVeil,
  inkHaloOnDark: palette.blackHalo,
  inkHaloOnLight: palette.whiteHalo,
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
  /**
   * The static weekday strip. Spec 17/-0.01em, IBM Plex Mono Medium — set a
   * touch under the spec's scaled 21, so the strip sits quieter under the
   * wordmark.
   */
  dayStrip: { fontFamily: fonts.metaLabel, fontSize: 19, fontWeight: "500", letterSpacing: -0.19 },
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
  /** A compact button's label — a smaller call to action set on a colour. */
  compactButton: { fontSize: 16, fontWeight: "600" },

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
  /** Long-form reading (a Daily Study's Read step): body size, loosely leaded for a page of it. */
  reading: { fontSize: 17, fontWeight: "400", lineHeight: 30 },
  /** A Scripture passage set as the page's centrepiece. Bodoni, generously leaded. */
  scripture: { fontFamily: fonts.editorialBody, fontSize: 24, fontWeight: "400", lineHeight: 36 },
} as const;

/**
 * Shadow geometry for raised surfaces. Colour comes from `colors.shadow`, so
 * a component composes `{ shadowColor: theme.colors.shadow, ...theme.elevation.card }`.
 */
const elevation = {
  /** A floating card, e.g. the Welcome screen's fanned phone mocks. */
  card: { shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 16 },
} as const;

/**
 * Line icons (lucide) share one stroke weight across the chrome — header
 * buttons and tab bar alike — so they read as one family.
 */
const icon = { strokeWidth: 2 } as const;

export const lightTheme = {
  name: "light",
  colors: lightColors,
  palette,
  spacing,
  radii,
  typography,
  icon,
  elevation,
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
  icon,
  elevation,
} as const;

export type Theme = typeof lightTheme | typeof darkTheme;
