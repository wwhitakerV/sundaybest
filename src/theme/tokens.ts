/** Design tokens. Every colour has a light and a dark value. */
import type { ReadingPaper } from "@/types/domain";

import { fonts } from "./fonts";

const palette = {
  white: "#FFFFFF",
  // Reading papers (READING_PAPERS): three warm off-whites, and a dark one
  // softer than night's.
  paperIvory: "#FBF8F1",
  paperCream: "#F5EEDF",
  paperSepia: "#EBDFC6",
  paperDusk: "#2A2B30",
  ink900: "#10131A",
  ink600: "#4A5160",
  ink300: "#9AA1B1",
  paper: "#F6F7FA",
  slate900: "#0B0D12",
  slate700: "#171A21",
  accent: "#D62626",
  lightIcon: "#d2d2d0",
  // A quiet grey that still reads as a line on white — lighter than
  // `lightIcon`, firmer than `mist`. Not from the brand
  // spec: set for Plan Detail's step sequence.
  greyLight: "#E4E4E7",
  // Brand palette. Fixed values, not theme-dependent — same as `accent`
  // above, these read the same in light and dark. More colours land here as
  // they're specified; this is not yet the full set.
  black: "#08090A",
  red: "#D62626",
  green: "#1FD19B",
  darkgrey: "#55555D",
  grey: "#8A8A92",
  // Navigation-chrome ink. Close to but distinct from `black` above — the
  // header/title/icon spec calls for this exact value, not the brand black.
  ink: "#111113",
  // Lines on the page, cool like `paper` and never warm: a row's hairline,
  // a container's edge, and a sheet's grabber — each a step darker than the
  // last. Each has a dark twin, the same steps up from a dark surface.
  mist: "#EFF0F3",
  cardEdge: "#E7E8EB",
  grabber: "#C5C6CA",
  mistOnDark: "#24272E",
  cardEdgeOnDark: "#33363C",
  grabberOnDark: "#52555E",
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
  // An exam subject's folio, a bound book: a near-black cloth cover with
  // warm paper-white ink on it, and the same paper for a cover not in view.
  folioCloth: "#171717",
  folioClothEdge: "#292929",
  folioPaper: "#F4F1EB",
  folioPaperMuted: "#C6C2BB",
  folioPaperFaint: "#BBB7B1",
  folioPaperRule: "rgba(244, 241, 235, 0.65)",
  folioPaperRuleFaint: "rgba(244, 241, 235, 0.38)",
  folioPaperEdgeStrong: "rgba(244, 241, 235, 0.8)",
  folioPressed: "rgba(255, 255, 255, 0.07)",
  folioPaperEdge: "#E4DFD6",
  // A choice that's picked, on a card of its own (an exam's way in): the
  // accent, softened to a wash, an edge, and a badge between the two.
  selectionMist: "#FEF5F5",
  selectionEdge: "#F4CFCF",
  selectionBlush: "#FBE4E4",
  selectionMistOnDark: "#241415",
  selectionEdgeOnDark: "#5A2626",
  selectionBlushOnDark: "#3A1C1D",
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
  // Pastels matched to the backdrops baked into Fun's illustrations, so each
  // one dissolves into the card it's set on: a hazy dawn (light, mid, deep),
  // rose, blush, butter, lilac, and sky.
  dawnLight: "#F8F5F1",
  dawn: "#F5EBDD",
  dawnDeep: "#F1D7A9",
  rose: "#FBDDE5",
  blush: "#FDF1F6",
  butter: "#FDF6E5",
  lilac: "#F5ECFA",
  sky: "#EFF6FD",
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
  /** Hairline rules between list rows. Darker than `surface`, lighter than `containerBorder`. */
  divider: string;
  /**
   * The edge of a card or grouped container — Settings' groups, `Card`, the
   * soft buttons. One token, so every container's edge is the same line.
   */
  containerBorder: string;
  /** A sheet's drag indicator: quiet, but plainly there. */
  grabber: string;
  /** The unfilled track of a ring or a scale, and a ring not yet earned. */
  progressTrack: string;
  /** A skeleton's blocks, standing in for content while it loads. */
  skeleton: string;
  accent: string;
  /**
   * Text and icons set on `accent` — the step you're on, on Plan Detail's day.
   */
  onAccent: string;
  /**
   * The quiet line a sequence runs along — joining the steps of Plan
   * Detail's day — and the ring of a step still to come on it.
   */
  sequenceLine: string;
  /** Filled primary controls — the button fill, not the page background. */
  controlPrimary: string;
  /** Text and icons sitting on `controlPrimary`. */
  onControlPrimary: string;
  /** Secondary text on `controlPrimary` — a build's step under its title. */
  onControlPrimaryMuted: string;
  /** Lines and tracks on `controlPrimary` — the generation bar's divider and progress track. */
  onControlPrimaryFaint: string;
  /** Something finished and ready — the generation bar once a plan is built. The brand green. */
  success: string;
  /** Text and icons on `success`; the green is light, so its ink is dark. */
  onSuccess: string;
  /** Secondary text on `success` — the ready plan's title under "Your plan is ready". */
  onSuccessMuted: string;
  /** Lines on `success` — the generation bar's divider. */
  onSuccessFaint: string;
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
   * An exam subject's folio — a bound book, the same in either theme: its
   * cloth cover and edge, and the paper-white ink on it (full, muted,
   * faint), its rules (the heading's, and the fainter one between exams),
   * an exam's arrow box, and the lift under a pressed row. A cover not in
   * view is the paper itself, edged, with cloth-dark ink.
   */
  folioCloth: string;
  folioClothEdge: string;
  /** The black spine binding a cover's left edge, up to its accent rule. */
  folioSpine: string;
  folioInk: string;
  folioInkMuted: string;
  folioInkFaint: string;
  folioRule: string;
  folioRuleFaint: string;
  folioArrowEdge: string;
  folioPressed: string;
  folioPaper: string;
  folioPaperEdge: string;
  /** Behind a choice that's picked, on a card of its own (an exam's way in). */
  selectionSurface: string;
  /** Its edge — the accent itself runs down its leading side. */
  selectionBorder: string;
  /** A round badge on it, a step deeper than its surface. */
  selectionBadge: string;
  /**
   * A wrong answer in a theology exam: ink, never red — a wrong answer there
   * is a teachable moment, and red is kept for what's selected. Always paired
   * with a ✕ and the word "Incorrect", never colour alone.
   */
  feedbackIncorrect: string;
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
  /**
   * Behind an illustration that carries a light backdrop of its own (Fun's
   * games): a pastel matched to it, so the art dissolves into its card. The
   * same in either theme, as the art's backdrop is; words and marks on one
   * are `inkOnLight*`. Dawn is a gradient — light, mid, deep. Rose is blush
   * with more red.
   */
  illustrationDawnLight: string;
  illustrationDawn: string;
  illustrationDawnDeep: string;
  illustrationRose: string;
  illustrationBlush: string;
  illustrationButter: string;
  illustrationLilac: string;
  illustrationSky: string;
};

const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.paper,
  text: palette.black,
  textMuted: palette.grey,
  textInactive: palette.darkgrey,
  border: palette.ink300,
  borderStrong: palette.darkgrey,
  divider: palette.mist,
  containerBorder: palette.cardEdge,
  grabber: palette.grabber,
  progressTrack: palette.greyLight,
  skeleton: palette.cardEdge,
  accent: palette.accent,
  onAccent: palette.white,
  sequenceLine: palette.greyLight,
  controlPrimary: palette.black,
  onControlPrimary: palette.white,
  onControlPrimaryMuted: palette.whiteMuted,
  onControlPrimaryFaint: palette.whiteFaint,
  success: palette.green,
  onSuccess: palette.black,
  onSuccessMuted: palette.blackMuted,
  onSuccessFaint: palette.blackFaint,
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
  folioCloth: palette.folioCloth,
  folioClothEdge: palette.folioClothEdge,
  folioSpine: palette.pureBlack,
  folioInk: palette.folioPaper,
  folioInkMuted: palette.folioPaperMuted,
  folioInkFaint: palette.folioPaperFaint,
  folioRule: palette.folioPaperRule,
  folioRuleFaint: palette.folioPaperRuleFaint,
  folioArrowEdge: palette.folioPaperEdgeStrong,
  folioPressed: palette.folioPressed,
  folioPaper: palette.folioPaper,
  folioPaperEdge: palette.folioPaperEdge,
  selectionSurface: palette.selectionMist,
  selectionBorder: palette.selectionEdge,
  selectionBadge: palette.selectionBlush,
  incorrectBorder: palette.incorrectLine,
  feedbackIncorrect: palette.black,
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
  illustrationDawnLight: palette.dawnLight,
  illustrationDawn: palette.dawn,
  illustrationDawnDeep: palette.dawnDeep,
  illustrationRose: palette.rose,
  illustrationBlush: palette.blush,
  illustrationButter: palette.butter,
  illustrationLilac: palette.lilac,
  illustrationSky: palette.sky,
};

const darkColors: ColorTokens = {
  background: palette.slate900,
  surface: palette.slate700,
  text: palette.white,
  textMuted: palette.grey,
  textInactive: palette.darkgrey,
  border: palette.ink600,
  borderStrong: palette.grey,
  divider: palette.mistOnDark,
  containerBorder: palette.cardEdgeOnDark,
  grabber: palette.grabberOnDark,
  progressTrack: palette.ink600,
  skeleton: palette.cardEdgeOnDark,
  accent: palette.accent,
  onAccent: palette.white,
  sequenceLine: palette.ink600,
  controlPrimary: palette.white,
  onControlPrimary: palette.black,
  onControlPrimaryMuted: palette.blackMuted,
  onControlPrimaryFaint: palette.blackFaint,
  success: palette.green,
  onSuccess: palette.black,
  onSuccessMuted: palette.blackMuted,
  onSuccessFaint: palette.blackFaint,
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
  folioCloth: palette.folioCloth,
  folioClothEdge: palette.folioClothEdge,
  folioSpine: palette.pureBlack,
  folioInk: palette.folioPaper,
  folioInkMuted: palette.folioPaperMuted,
  folioInkFaint: palette.folioPaperFaint,
  folioRule: palette.folioPaperRule,
  folioRuleFaint: palette.folioPaperRuleFaint,
  folioArrowEdge: palette.folioPaperEdgeStrong,
  folioPressed: palette.folioPressed,
  folioPaper: palette.folioPaper,
  folioPaperEdge: palette.folioPaperEdge,
  selectionSurface: palette.selectionMistOnDark,
  selectionBorder: palette.selectionEdgeOnDark,
  selectionBadge: palette.selectionBlushOnDark,
  incorrectBorder: palette.incorrectLineOnDark,
  feedbackIncorrect: palette.white,
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
  // Matched to art whose light backdrop is baked in: they read the same.
  illustrationDawnLight: palette.dawnLight,
  illustrationDawn: palette.dawn,
  illustrationDawnDeep: palette.dawnDeep,
  illustrationRose: palette.rose,
  illustrationBlush: palette.blush,
  illustrationButter: palette.butter,
  illustrationLilac: palette.lilac,
  illustrationSky: palette.sky,
};

/**
 * The spacing scale: every gap, padding and margin the app repeats, in points,
 * each named by its own value so a mock's 22 reads as `space[22]`. A number not
 * on it is one-off geometry, kept beside its component as a named constant with
 * its reason (ADR 0016).
 *
 * Spacing, corners and control heights read the same in every theme, so they
 * are imported directly (`import { space } from "@/theme"`) and work inside
 * `StyleSheet.create`. Colour stays on `useTheme()`.
 */
export const space = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  15: 15,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  28: 28,
  32: 32,
  36: 36,
  40: 40,
} as const;

/** The corner scale, named by value like `space`. `pill` rounds any height fully. */
export const radius = {
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  23: 23,
  24: 24,
  28: 28,
  32: 32,
  36: 36,
  pill: 999,
} as const;

/**
 * Motion, the same in every theme. `snap` and `sheet` are critically damped
 * and clamped: a thing that moves lands and stops — no bounce for the eye to
 * chase. `slide` keeps the least give, for an outline moving between choices.
 * Spread into Reanimated's `withSpring` with `reduceMotion` added.
 */
export const motion = {
  /** A marker landing on what's picked: a scale's dot, a filter's outline. */
  snap: { duration: 200, dampingRatio: 1, overshootClamping: true },
  /**
   * An outline sliding to what's picked — Plan Detail's day, the paper, the
   * tab, Plans' filter: one spring, quick with the least give, so every
   * selection in the app moves alike.
   */
  slide: { damping: 18, stiffness: 220, mass: 0.8 },
  /** A sheet rising from the bottom edge, as iOS's own do. */
  sheet: { duration: 380, dampingRatio: 1, overshootClamping: true },
  /** How long anything takes to leave: a sheet sliding down, a menu fading. */
  exitMs: 200,
  /**
   * A skeleton's breath, Apple's way: each half of the pulse this long, from
   * full to `skeletonDim` and back. Held still under Reduce Motion.
   */
  skeletonPulseMs: 900,
  skeletonDim: 0.5,
} as const;

/** The heights controls repeat. */
export const controlHeight = {
  /** The smallest a tap target gets: a compact button, an icon button, a header row. */
  hitTarget: 44,
  /** A header's round icon button. */
  headerButton: 49,
  /** A screen header's row. */
  header: 54,
  /** The full-width primary `Button`. */
  button: 61,
} as const;

/**
 * The older named scales, read through the theme (`theme.spacing.md`) by Fun
 * and Exams, which sit outside the token migration. Everything else uses
 * `space` and `radius`.
 */
const spacing = {
  xs: space[4],
  sm: space[8],
  md: space[16],
  lg: space[24],
  xl: space[32],
} as const;

/** `card` is a featured or tappable card's corner (Fun's hero, games, and banner). */
const radii = {
  sm: 6,
  md: radius[10],
  lg: radius[16],
  card: radius[20],
  xl: radius[24],
  pill: radius.pill,
} as const;

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
  /** The editorial face, larger: the title of the day picked on Plan Detail. */
  editorialTitle: { fontFamily: fonts.editorialHeading, fontSize: 24, fontWeight: "500" },
  /** A study question set in the editorial face (Reflect, and the Welcome tour's copy of it). */
  editorialQuestion: {
    fontFamily: fonts.editorialHeading,
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 30,
  },
  /** The editorial face at its largest: a page's own title (a theology exam's overview). */
  editorialDisplay: {
    fontFamily: fonts.editorialHeading,
    fontSize: 34,
    fontWeight: "500",
    lineHeight: 43,
    letterSpacing: -0.3,
  },
  /**
   * The editorial face at its grandest: a page named like a book (Theology
   * Exams). Bodoni's line is kept 1.25× its size: set any tighter, iOS
   * keeps the room below the baseline and trims the tops of its capitals
   * (0.75× its size) and ascenders.
   */
  editorialHero: {
    fontFamily: fonts.editorialHeading,
    fontSize: 52,
    fontWeight: "500",
    lineHeight: 65,
    letterSpacing: -1.6,
  },
  /** A subject's name on its book's cover: set close, never so close it clips (1.25×). */
  folioTitle: {
    fontFamily: fonts.editorialHeading,
    fontSize: 40,
    fontWeight: "500",
    lineHeight: 50,
    letterSpacing: -1.6,
  },
  /** …and on a book made shorter to fit a shorter screen. */
  folioTitleCompact: {
    fontFamily: fonts.editorialHeading,
    fontSize: 30,
    fontWeight: "500",
    lineHeight: 38,
    letterSpacing: -1.2,
  },
  /** An exam's title in a book's list. */
  folioItem: { fontFamily: fonts.editorialBody, fontSize: 17, fontWeight: "400", lineHeight: 22 },
  /** A folio's small print — its kicker, its section — in the mono, capitals, tracked. */
  folioMeta: { fontFamily: fonts.metaLabel, fontSize: 11, fontWeight: "500", letterSpacing: 1.1 },
  /** A level above an exam in a folio — no smaller than iOS reads comfortably. */
  folioLevel: { fontFamily: fonts.metaLabel, fontSize: 11, fontWeight: "500", letterSpacing: 1 },
  /** The line under such a title: the editorial reading face, a size over body. */
  editorialLead: {
    fontFamily: fonts.editorialBody,
    fontSize: 19,
    fontWeight: "400",
    lineHeight: 26,
  },
  metaLabel: { fontFamily: fonts.metaLabel, fontSize: 13, fontWeight: "500" },
  /** `metaLabel`, tracked a point — a line of status set in capitals (a hero's, a day row's heading). */
  metaLabelTracked: {
    fontFamily: fonts.metaLabel,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
  },
  /**
   * A label set above what it names — a page's kicker ("Subject 01 / 12",
   * "Scripture & Reading / Foundations"), a section's name, an exam's level:
   * the mono, in capitals, tracked wide. One style, so every such label in
   * the app reads the same.
   */
  kicker: {
    fontFamily: fonts.metaLabel,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  metaBody: { fontFamily: fonts.metaBody, fontSize: 13, fontWeight: "400" },
  metaEmphasis: { fontFamily: fonts.metaEmphasis, fontSize: 11, fontWeight: "600" },
  body: { fontSize: 17, fontWeight: "400" },
  /** Body, leaded for a short paragraph in a sheet. */
  bodyLoose: { fontSize: 17, fontWeight: "400", lineHeight: 26 },
  label: { fontSize: 14, fontWeight: "500" },
  headline: { fontSize: 24, fontWeight: "700" },
  /** The headline's size at regular weight — a number chosen from a row (New Plan's days). */
  headlineRegular: { fontSize: 24, fontWeight: "400" },
  /** A title on a large card (the Plans library's): bold, set close for up to three lines. */
  cardTitle: { fontSize: 20, fontWeight: "700", lineHeight: 25 },
  smallCardTitle: { fontSize: 18, fontWeight: "600", lineHeight: 22 },
  /** The number on a small tile (Plan Detail's days): large enough to read at a glance. */
  tileNumber: { fontSize: 22, fontWeight: "600" },
  /** A study step's name on its row (Plan Detail's day): clear, and firm enough to tap. */
  stepTitle: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
  /** The date under it: small, in the hero's mono, set in capitals by the tile. */
  tileDate: { fontFamily: fonts.metaLabel, fontSize: 11, fontWeight: "500", letterSpacing: 0.6 },

  /** Hero sentence. Spec 30/500/1.06/-0.03em. */
  display: { fontSize: 37, fontWeight: "500", lineHeight: 39, letterSpacing: -1.11 },
  /**
   * The static weekday strip. Spec 17/-0.01em, IBM Plex Mono Medium — set a
   * touch under the spec's scaled 21, so the strip sits quieter under the
   * wordmark.
   */
  dayStrip: { fontFamily: fonts.metaLabel, fontSize: 19, fontWeight: "500", letterSpacing: -0.19 },
  /** The date opposite the wordmark on Home: the day strip's mono, a size under the wordmark. */
  headerDate: {
    fontFamily: fonts.metaLabel,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.15,
  },
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
  /** A list item's weight, larger — a sermon's title over its preview. */
  listItemLarge: { fontSize: 20, fontWeight: "500" },
  /** Button labels, both variants. Spec 15/-0.01em. */
  button: { fontSize: 18, fontWeight: "600" },
  /** A compact button's label — a smaller call to action set on a colour. */
  compactButton: { fontSize: 16, fontWeight: "600" },
  /** A heading over one section of a scrolling page ("Play now"): bold, a step under `headline`. */
  sectionTitle: { fontSize: 22, fontWeight: "700", lineHeight: 28, letterSpacing: -0.22 },
  /** A title on a tile or a small card (Fun's games): bold, set close. */
  tileTitle: { fontSize: 17, fontWeight: "700", lineHeight: 22 },
  /** Supporting copy on a card, under its title: a line or two, quiet. */
  cardDetail: { fontSize: 15, fontWeight: "400", lineHeight: 20 },
  /** A line of facts under a page's title ("12 subjects · 48 exams"): the system face, firm and easy to read. */
  summaryStrong: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  /** A fact set plainly in a row ("15 questions", "8–12 min"): the system face, small and firm enough to read. */
  factLabel: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  /** A tag's label — a small pill naming a kind or a count ("Quiz", "12 day streak"). */
  tag: { fontSize: 12, fontWeight: "600", lineHeight: 16 },

  /** Centered header title ("New plan", "Day 2 of 6", "Quick check"). Spec 14/500. */
  navTitle: { fontSize: 17, fontWeight: "500" },
  /** A full-screen fallback's heading ("Something went wrong") — where the app's own components can't be used. */
  fallbackTitle: { fontSize: 20, fontWeight: "600" },
  /** …its message… */
  fallbackBody: { fontSize: 15, fontWeight: "400" },
  /** …and its one action ("Try again"). */
  fallbackAction: { fontSize: 15, fontWeight: "600" },
  /** The clock in a drawn phone's status bar (the Welcome tour's phones). */
  statusTime: { fontSize: 17, fontWeight: "600" },
  /** Top-level tab-root titles (Plans, Progress, Settings). Spec 24/500/1.12/-0.02em. */
  screenTitle: { fontSize: 29, fontWeight: "500", lineHeight: 32, letterSpacing: -0.58 },
  /** A header's right-aligned step count ("1 of 2"). Spec 11 mono/0.02em. */
  stepCounter: { fontFamily: fonts.metaBody, fontSize: 14, fontWeight: "400", letterSpacing: 0.28 },
  /** A segmented control's option label. Spec 12.5/400. */
  segmentLabel: { fontSize: 15, fontWeight: "400" },
  /** The picked option's label: the same size, firmer. */
  segmentLabelActive: { fontSize: 15, fontWeight: "600" },
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
  /**
   * A question set as the page's centrepiece (a theology exam's): the
   * editorial face, a step over `editorialTitle`, leaded for several lines.
   */
  question: { fontFamily: fonts.editorialHeading, fontSize: 26, fontWeight: "500", lineHeight: 34 },
  /** A line to keep, set apart on a reading page: the editorial face, leaded. */
  pullLine: { fontFamily: fonts.editorialHeading, fontSize: 20, fontWeight: "500", lineHeight: 28 },
} as const;

/**
 * Shadow geometry for raised surfaces. Colour comes from `colors.shadow`, so
 * a component composes `{ shadowColor: theme.colors.shadow, ...theme.elevation.card }`.
 */
const elevation = {
  /** A floating card, e.g. the Welcome screen's fanned phone mocks. */
  card: { shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 16 },
  /** A book lying on the page: an exam subject's folio. */
  folio: { shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.14, shadowRadius: 16 },
  /** A menu floating over the page: a soft, wide shadow. */
  menu: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
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
 * Read only on a dark reading paper (`getReadingTheme`) for now — app-wide
 * dark mode is a deliberate future feature with its own design, not a
 * response to the OS colour scheme (see `use-theme.ts`).
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

/**
 * The papers the Daily Study can be read on, in the reading sheet's order: a
 * light paper keeps the light theme's ink, a dark one takes the dark theme's
 * (`getReadingTheme`). Fixed colours, the same whatever the app's theme.
 */
export const READING_PAPERS: readonly {
  id: ReadingPaper;
  label: string;
  background: string;
  dark: boolean;
}[] = [
  { id: "white", label: "White", background: palette.white, dark: false },
  { id: "ivory", label: "Ivory", background: palette.paperIvory, dark: false },
  { id: "cream", label: "Cream", background: palette.paperCream, dark: false },
  { id: "sepia", label: "Sepia", background: palette.paperSepia, dark: false },
  { id: "dusk", label: "Dusk", background: palette.paperDusk, dark: true },
  { id: "night", label: "Night", background: palette.slate900, dark: true },
];
