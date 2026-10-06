import { AppError } from "../http/errors.js";
import { normalizeSourceText } from "./transcript.js";

const books = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
  "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum",
  "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
] as const;
const aliases = new Map<string, string>(books.map((book) => [book.toLowerCase(), book]));
aliases.set("psalm", "Psalms");
aliases.set("song of songs", "Song of Solomon");
aliases.set("revelations", "Revelation");

const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function words(n: number): string {
  if (n < 20) return small[n]!;
  if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${small[n % 10]}` : ""}`;
  return `one hundred${n % 100 ? ` ${words(n % 100)}` : ""}`;
}
const numbers = new Map(Array.from({ length: 177 }, (_, n) => [words(n), String(n)]));
const numberPattern = new RegExp(`\\b(${[...numbers.keys()].sort((a, b) => b.length - a.length).join("|")})\\b`, "g");

function normalizeSpokenReference(value: string): string {
  return normalizeSourceText(value).replace(/\bfirst\b/g, "1").replace(/\bsecond\b/g, "2")
    .replace(/\bthird\b/g, "3").replace(/(?<=[a-z])-(?=[a-z])/g, " ")
    .replace(/one hundred and /g, "one hundred ").replace(numberPattern, (match) => numbers.get(match)!);
}

export interface ScriptureRange {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
}

/** A Scripture the sermon names: verse bounds are null when only the chapter is named. */
export interface ScriptureCitation {
  book: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  reference: string;
}

/** Canonical form built from the numbers alone, ignoring the written reference. */
export function canonicalizeScriptureFields(input: ScriptureRange): ScriptureRange {
  const verses = `${input.verseStart}${input.verseEnd === input.verseStart ? "" : `-${input.verseEnd}`}`;
  return canonicalizeScripture({ ...input, reference: `${input.book} ${input.chapter}:${verses}` });
}

export function canonicalizeScripture(input: ScriptureRange): ScriptureRange {
  const canonical = canonicalizeCitation(input);
  return { ...input, book: canonical.book, reference: canonical.reference };
}

export function canonicalizeCitation<T extends ScriptureCitation>(input: T): T {
  const book = aliases.get(normalizeSpokenReference(input.book));
  if (!book) throw new AppError("INTERNAL", "Generated Scripture uses an unknown book");
  const displayBook = book === "Psalms" ? "Psalm" : book;
  const verses = input.verseStart === null ? "" : `:${input.verseStart}${input.verseEnd === input.verseStart ? "" : `-${input.verseEnd}`}`;
  const reference = `${displayBook} ${input.chapter}${verses}`;
  // Fields and display reference must describe the same passage, not competing identities.
  if (!sameReference(input.reference, reference)) {
    throw new AppError("INTERNAL", "Generated Scripture fields disagree with its reference");
  }
  return { ...input, book, reference };
}

/** A spoken or written reference: book, chapter, and optionally a verse or verse range. */
function referencePattern(): RegExp {
  return new RegExp(`\\b(${[...aliases.keys()].sort((a, b) => b.length - a.length).join("|")})\\s+(?:chapter\\s+)?(\\d{1,3})(?:\\s*(?::|,?\\s+verses?\\s+|\\s+)(\\d{1,3})(?:\\s*(?:-|through|to|and)\\s*(\\d{1,3}))?)?\\b`, "g");
}

/**
 * Every chapter the sermon names, once each and in the order it first names
 * them ("1 Corinthians 13", "Psalm 23"): the only chapters a day may study.
 */
export function namedChapters(source: string): string[] {
  const chapters = new Set<string>();
  for (const match of normalizeSpokenReference(source).matchAll(referencePattern())) {
    const book = aliases.get(match[1]!)!;
    chapters.add(`${book === "Psalms" ? "Psalm" : book} ${Number(match[2])}`);
  }
  return [...chapters];
}

/** Conservative evidence check. An explicitly named chapter permits a passage within it. */
export function referenceIsNamed(source: string, scripture: ScriptureCitation): boolean {
  for (const match of normalizeSpokenReference(source).matchAll(referencePattern())) {
    if (aliases.get(match[1]!) !== scripture.book || Number(match[2]) !== scripture.chapter) continue;
    // A whole-chapter citation needs only the chapter to be named.
    if (match[3] === undefined || scripture.verseStart === null || scripture.verseEnd === null) return true;
    if (scripture.verseStart >= Number(match[3]) && scripture.verseEnd <= Number(match[4] ?? match[3])) return true;
  }
  return false;
}

/**
 * A day may study any passage in a chapter the sermon names, in any form:
 * preachers name where a reading starts ("Luke 16, verse 19") and read on.
 * The Bible check then confirms every verse exists.
 */
export function chapterIsNamed(source: string, scripture: ScriptureCitation): boolean {
  return referenceIsNamed(source, { ...scripture, verseStart: null, verseEnd: null });
}

/** Whether a free-form reference names the same passage as a canonical one ("john 3:16–18" and "John 3:16-18"). */
export function sameReference(supplied: string, canonical: string): boolean {
  const normalized = normalizeSpokenReference(supplied).replace(/^psalms\b/, "psalm")
    .replace(/^song of songs\b/, "song of solomon").replace(/[–—]/g, "-").replace(/\s+/g, "");
  return normalized === normalizeSourceText(canonical).replace(/\s+/g, "");
}
