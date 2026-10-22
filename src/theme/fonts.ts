import CanelaMedium from "../../assets/fonts/Canela_Collection/Canela_Family/Canela-Medium-Trial.otf";
import CanelaDeckMedium from "../../assets/fonts/Canela_Collection/Canela_Deck_Family/CanelaDeck-Medium-Trial.otf";
import TiemposTextRegular from "../../assets/fonts/Tiempos_Text_Family/TiemposText-Regular-Trial.otf";
import TiemposTextItalic from "../../assets/fonts/Tiempos_Text_Family/TiemposText-RegularItalic-Trial.otf";
import SoehneBuch from "../../assets/fonts/Soehne_Family/Soehne-Buch-Trial.otf";
import SoehneKraeftig from "../../assets/fonts/Soehne_Family/Soehne-Kraeftig-Trial.otf";
import SoehneHalbfett from "../../assets/fonts/Soehne_Family/Soehne-Halbfett-Trial.otf";
import SoehneDreiviertelfett from "../../assets/fonts/Soehne_Family/Soehne-Dreiviertelfett-Trial.otf";

/**
 * Font family keys, mapped to the actual font files in `assets/fonts/`.
 *
 * `useFonts()` (called once in `AppProviders`) registers each asset under the
 * key here, so `fontFamily` styles reference a name this app chose — never
 * the font file's own internal PostScript name — and each key is one cut:
 * a role names the cut it's drawn in, and its `fontWeight` matches that
 * cut's own, so iOS never reaches for another.
 *
 * Three families, each with one job (ADR 0034):
 * - **Canela** — the wordmark and the expressive headlines (34pt and over);
 *   **Canela Deck**, its cut for middling sizes, for plan titles, study
 *   headings and questions, and the status bar's time.
 * - **Söhne** — the interface: navigation, buttons, tabs, settings, labels,
 *   metadata. Buch (400), Kräftig (500), Halbfett (600), Dreiviertelfett (700).
 * - **Tiempos Text** — reading: teaching, Scripture, reflections, prayers.
 *
 * These are the foundries' TRIAL files — for evaluation inside the team only,
 * never in a build that leaves it, and cut down to letters, figures and
 * `. , -` (Söhne, Tiempos) or a few more (Canela): iOS draws the rest —
 * apostrophes, quotes, ? ! : ; ( ) & — in its own face. Licensed files
 * replace them before release — see docs/SETUP_CHECKLIST.md.
 */
export const FONT_ASSETS = {
  "Canela-Medium": CanelaMedium,
  "CanelaDeck-Medium": CanelaDeckMedium,
  "TiemposText-Regular": TiemposTextRegular,
  "TiemposText-Italic": TiemposTextItalic,
  "Soehne-Buch": SoehneBuch,
  "Soehne-Kraeftig": SoehneKraeftig,
  "Soehne-Halbfett": SoehneHalbfett,
  "Soehne-Dreiviertelfett": SoehneDreiviertelfett,
} as const;

export type FontFamilyKey = keyof typeof FONT_ASSETS;

/**
 * Semantic font roles, per the design spec: which cut each kind of text uses.
 * Nothing in SundayBest's own components is drawn in SF Pro; iOS keeps it for
 * what it draws itself (the keyboard, alerts, the share sheet).
 */
export const fonts = {
  /** The SUNDAYBEST wordmark. Never apply a bold override. */
  masthead: "Canela-Medium" satisfies FontFamilyKey,
  /** Expressive headlines: a page named like a book, an exam's title, a hero sentence. */
  display: "Canela-Medium" satisfies FontFamilyKey,
  /** Plan titles, study headings, questions, pull lines; the status bar's time. */
  editorialHeading: "CanelaDeck-Medium" satisfies FontFamilyKey,
  /** Reading: teaching, Scripture, reflections, prayers. */
  editorialBody: "TiemposText-Regular" satisfies FontFamilyKey,
  /** The interface, regular: body copy, rows' details, segments. */
  ui: "Soehne-Buch" satisfies FontFamilyKey,
  /** The interface, medium: labels, list items, titles. */
  uiMedium: "Soehne-Kraeftig" satisfies FontFamilyKey,
  /** The interface, semibold: buttons, tags, firm facts. */
  uiSemibold: "Soehne-Halbfett" satisfies FontFamilyKey,
  /** The interface, bold: headlines, card and section titles. */
  uiBold: "Soehne-Dreiviertelfett" satisfies FontFamilyKey,
  /** Dates, "Day 2 of 6", eyebrows, timestamps — Söhne, often tracked capitals. */
  metaLabel: "Soehne-Kraeftig" satisfies FontFamilyKey,
  /** Longer metadata / helper copy. */
  metaBody: "Soehne-Buch" satisfies FontFamilyKey,
  /** Tiny active states only, where more contrast is needed than Medium gives. */
  metaEmphasis: "Soehne-Halbfett" satisfies FontFamilyKey,
} as const;

/** Each cut's italic, where the app sets that cut in italic (a verse's line, what a reader wrote). */
const ITALICS: ReadonlyMap<string, FontFamilyKey> = new Map<string, FontFamilyKey>([
  ["TiemposText-Regular", "TiemposText-Italic"],
]);

/** The italic of a cut — itself where the app has none loaded, so iOS slants nothing it shouldn't. */
export function italicFace(face: string | undefined): string | undefined {
  return (face && ITALICS.get(face)) ?? face;
}
