import type { Entity } from "./common";

/** The Bible translations the app offers, from Settings → Bible translation. */
export type BibleTranslation = "NIV" | "ESV" | "KJV" | "NLT" | "BSB";

/** One numbered verse of a passage. */
export type ScriptureVerse = {
  number: number;
  text: string;
};

/** A Bible passage, in one translation — a day's Scripture step. */
export type ScripturePassage = Entity & {
  /** How it's cited: `"Ephesians 2:8–9"`. */
  reference: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: BibleTranslation;
  verses: ScriptureVerse[];
};
