import LibreBaskervilleRegular from "../../assets/fonts/LibreBaskerville-Regular.ttf";
import LibreBaskervilleMedium from "../../assets/fonts/LibreBaskerville-Medium.ttf";
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
 *
 * Libre Baskerville's two files are static cuts (400 and 500) of the variable
 * `LibreBaskerville-VariableFont_wght.ttf`, made with fontTools'
 * `varLib.instancer --static --update-name-table`: iOS can't pick a weight off
 * a variable font's axis through `fontWeight`, so each weight is its own file.
 */
export const FONT_ASSETS = {
  "LibreBaskerville-Regular": LibreBaskervilleRegular,
  "LibreBaskerville-Medium": LibreBaskervilleMedium,
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
  masthead: "LibreBaskerville-Medium" satisfies FontFamilyKey,
  /** Devotional headings / pull lines. */
  editorialHeading: "LibreBaskerville-Medium" satisfies FontFamilyKey,
  /** Longer prayer or reading text. */
  editorialBody: "LibreBaskerville-Regular" satisfies FontFamilyKey,
  /** Dates, "Day 2 of 6", issue numbers, timestamps. */
  metaLabel: "IBMPlexMono-Medium" satisfies FontFamilyKey,
  /** Longer metadata / helper copy. */
  metaBody: "IBMPlexMono-Regular" satisfies FontFamilyKey,
  /** Tiny active states only, where more contrast is needed than Medium gives. */
  metaEmphasis: "IBMPlexMono-SemiBold" satisfies FontFamilyKey,
} as const;
