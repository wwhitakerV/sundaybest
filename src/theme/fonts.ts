import BodoniModa9ptRegular from "../../assets/fonts/BodoniModa_9pt-Regular.ttf";
import BodoniModa9ptMedium from "../../assets/fonts/BodoniModa_9pt-Medium.ttf";
import IBMPlexMonoRegular from "../../assets/fonts/IBMPlexMono-Regular.ttf";
import IBMPlexMonoMedium from "../../assets/fonts/IBMPlexMono-Medium.ttf";
import IBMPlexMonoSemiBold from "../../assets/fonts/IBMPlexMono-SemiBold.ttf";

/**
 * Font family keys, mapped to the actual font files in `assets/fonts/`.
 *
 * `useFonts()` (called once in `AppProviders`) registers each asset under the
 * key here, so `fontFamily` styles reference a name this app chose — never
 * the font file's own internal PostScript name, which is inconsistent per
 * weight (e.g. IBM Plex Mono Medium's internal family name is "IBM Plex Mono
 * Medium", not "IBM Plex Mono" at a different weight) and would be a
 * typo-prone string to spread across the app otherwise.
 */
export const FONT_ASSETS = {
  "BodoniModa9pt-Regular": BodoniModa9ptRegular,
  "BodoniModa9pt-Medium": BodoniModa9ptMedium,
  "IBMPlexMono-Regular": IBMPlexMonoRegular,
  "IBMPlexMono-Medium": IBMPlexMonoMedium,
  "IBMPlexMono-SemiBold": IBMPlexMonoSemiBold,
} as const;

export type FontFamilyKey = keyof typeof FONT_ASSETS;

/**
 * Semantic font roles, per the design spec: which family/weight each kind of
 * text uses. SF Pro (the sans body/UI face) is deliberately absent — it is
 * the system font, so components use it by leaving `fontFamily` unset rather
 * than bundling and loading a font iOS already ships.
 */
export const fonts = {
  /** SUNDAYBEST masthead and editorial headings. Never apply a bold override. */
  masthead: "BodoniModa9pt-Medium" satisfies FontFamilyKey,
  /** Devotional headings / pull lines. */
  editorialHeading: "BodoniModa9pt-Medium" satisfies FontFamilyKey,
  /** Longer prayer or reading text. */
  editorialBody: "BodoniModa9pt-Regular" satisfies FontFamilyKey,
  /** Dates, "Day 2 of 6", issue numbers, timestamps. */
  metaLabel: "IBMPlexMono-Medium" satisfies FontFamilyKey,
  /** Longer metadata / helper copy. */
  metaBody: "IBMPlexMono-Regular" satisfies FontFamilyKey,
  /** Tiny active states only, where more contrast is needed than Medium gives. */
  metaEmphasis: "IBMPlexMono-SemiBold" satisfies FontFamilyKey,
} as const;
