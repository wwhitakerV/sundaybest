/** Public-domain translations bundled with the API. Copyrighted ones come only from a licensed gateway. */
export const BIBLE_TRANSLATIONS = ["BSB", "KJV"] as const;
export type BibleTranslation = (typeof BIBLE_TRANSLATIONS)[number];

/** Keys are stable numeric book IDs, chapters, and verse numbers. */
export interface BibleAsset {
  schemaVersion: 1;
  translation: BibleTranslation;
  books: Record<string, Record<string, Record<string, string>>>;
}

export interface VerseLocation {
  bookId: number;
  chapter: number;
  verse: number;
}

export interface BibleBook {
  id: number;
  name: string;
  displayName: string;
  aliases: string[];
  chapterCount: number;
}

export interface TranslationManifest {
  name: string;
  file: string;
  contentSha256: string;
  version: string;
  bookCount: number;
  chapterCount: number;
  verseEntryCount: number;
  nonemptyVerseCount: number;
  omittedVerses: VerseLocation[];
}

export interface VerseMapping {
  bookId: number;
  chapter: number;
  fromTranslation: BibleTranslation;
  toTranslation: BibleTranslation;
  fromVerseStart: number;
  fromVerseEnd: number;
  toVerseStart: number;
  toVerseEnd: number;
}

export interface BibleManifest {
  schemaVersion: 1;
  books: BibleBook[];
  translations: Record<BibleTranslation, TranslationManifest>;
  verseMappings: VerseMapping[];
}

/** Persist this reference with the plan, independently of Bible text. */
export interface BibleReference {
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  referenceTranslation: BibleTranslation;
}

/** Additive fields for the existing study Scripture response. */
export interface BiblePassageResult {
  requestedReference: string;
  reference: string;
  referenceTranslation: BibleTranslation;
  translation: BibleTranslation;
  bookId: number;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  provider: "bundled-bible";
  providerVersion: string;
  passageStatus: "complete" | "partial" | "unavailable";
  verses: Array<{ number: number; text: string }>;
  missingVerses: Array<{ number: number; reason: "omitted_in_translation" }>;
  notes: Array<{
    kind: "omission" | "verse_mapping";
    reference: string;
    message: string;
  }>;
}
