import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bibleAssetSchema, bibleManifestSchema } from "./schema.js";
import { BIBLE_TRANSLATIONS } from "./types.js";
import type {
  BibleAsset, BibleBook, BibleManifest, BiblePassageResult,
  BibleReference, BibleTranslation, VerseLocation,
} from "./types.js";

interface LoadedBible {
  manifest: BibleManifest;
  assets: Record<BibleTranslation, BibleAsset>;
  byName: Map<string, BibleBook>;
  byId: Map<number, BibleBook>;
}

const loadedDirectories = new Map<string, LoadedBible>();
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const isTranslation = (value: unknown): value is BibleTranslation =>
  BIBLE_TRANSLATIONS.some((translation) => translation === value);

export class BibleLookupError extends Error {
  constructor(public readonly code: "INVALID_REFERENCE" | "UNSUPPORTED_TRANSLATION", message: string) {
    super(message);
    this.name = "BibleLookupError";
  }
}

function requireTranslation(value: unknown): asserts value is BibleTranslation {
  if (!isTranslation(value)) {
    throw new BibleLookupError("UNSUPPORTED_TRANSLATION", `Unsupported Bible translation: ${String(value)}`);
  }
}

function load(directory: string): LoadedBible {
  const path = resolve(directory);
  const existing = loadedDirectories.get(path);
  if (existing) return existing;
  const parsedManifest = bibleManifestSchema.safeParse(JSON.parse(readFileSync(join(path, "manifest.json"), "utf8")));
  if (!parsedManifest.success) throw new Error("Invalid bundled Bible manifest");
  const manifest: BibleManifest = parsedManifest.data;
  const assets = {} as Record<BibleTranslation, BibleAsset>;
  for (const translation of BIBLE_TRANSLATIONS) {
    const metadata = manifest.translations[translation];
    const bytes = readFileSync(join(path, `${translation.toLowerCase()}.json`));
    if (createHash("sha256").update(bytes).digest("hex") !== metadata.contentSha256) {
      throw new Error(`Bundled ${translation} asset does not match its manifest`);
    }
    const asset = bibleAssetSchema.safeParse(JSON.parse(bytes.toString("utf8")));
    if (!asset.success || asset.data.translation !== translation || Object.keys(asset.data.books).length !== 66) {
      throw new Error(`Invalid bundled ${translation} asset`);
    }
    assets[translation] = { ...asset.data, schemaVersion: 1 };
  }
  const byName = new Map<string, BibleBook>();
  const byId = new Map<number, BibleBook>();
  for (const book of manifest.books) {
    byId.set(book.id, book);
    for (const name of [book.name, book.displayName, ...book.aliases]) byName.set(normalized(name), book);
  }
  const result = { manifest, assets, byName, byId };
  loadedDirectories.set(path, result);
  return result;
}

function referenceText(book: BibleBook, chapter: number, start: number, end: number): string {
  return `${book.displayName} ${chapter}:${start}${end === start ? "" : `-${end}`}`;
}

// `api/data/bible`, found from this module so it resolves the same from
// `src/bible` (tsx) and `dist/bible` (the build), whatever the working directory.
const DEFAULT_DIRECTORY = fileURLToPath(new URL("../../data/bible", import.meta.url));

/** Create once at API/worker startup. Assets are shared per process and directory. */
export function createBibleStore(directory = DEFAULT_DIRECTORY) {
  const data = load(directory);

  function validateReference(input: BibleReference): BibleBook {
    requireTranslation(input.referenceTranslation);
    const book = data.byId.get(input.bookId);
    if (!book || !Number.isInteger(input.chapter) || input.chapter < 1 || input.chapter > book.chapterCount ||
        !Number.isInteger(input.verseStart) || !Number.isInteger(input.verseEnd) ||
        input.verseStart < 1 || input.verseEnd < input.verseStart) {
      throw new BibleLookupError("INVALID_REFERENCE", "Invalid Bible book, chapter, or verse range");
    }
    const verses = data.assets[input.referenceTranslation].books[String(book.id)]?.[String(input.chapter)];
    if (!verses || input.verseEnd > Math.max(...Object.keys(verses).map(Number))) {
      throw new BibleLookupError("INVALID_REFERENCE", "Verse range is outside the reference translation");
    }
    for (let number = input.verseStart; number <= input.verseEnd; number++) {
      if (verses[String(number)] === undefined) {
        throw new BibleLookupError("INVALID_REFERENCE", "Verse number is absent from the reference translation");
      }
    }
    return book;
  }

  function parseReference(reference: string, referenceTranslation: BibleTranslation): BibleReference {
    requireTranslation(referenceTranslation);
    const match = /^\s*(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\s*$/.exec(reference);
    const book = match ? data.byName.get(normalized(match[1]!)) : undefined;
    if (!match || !book) {
      throw new BibleLookupError("INVALID_REFERENCE", "Use a full book name and a single-chapter verse range");
    }
    const result: BibleReference = {
      bookId: book.id, chapter: Number(match[2]), verseStart: Number(match[3]),
      verseEnd: Number(match[4] ?? match[3]), referenceTranslation,
    };
    validateReference(result);
    return result;
  }

  function getPassage(input: BibleReference & { translation: BibleTranslation }): BiblePassageResult {
    requireTranslation(input.translation);
    const book = validateReference(input);
    const target = data.assets[input.translation].books[String(book.id)]![String(input.chapter)]!;
    const mapping = data.manifest.verseMappings.find((item) =>
      item.bookId === input.bookId && item.chapter === input.chapter &&
      item.fromTranslation === input.referenceTranslation && item.toTranslation === input.translation &&
      input.verseStart <= item.fromVerseEnd && input.verseEnd >= item.fromVerseStart);
    // Map only explicit known boundaries. Never infer a mapping by clamping.
    const start = mapping && input.verseStart >= mapping.fromVerseStart
      ? mapping.toVerseStart : input.verseStart;
    const end = mapping && input.verseEnd <= mapping.fromVerseEnd
      ? mapping.toVerseEnd : input.verseEnd;
    const requestedReference = referenceText(book, input.chapter, input.verseStart, input.verseEnd);
    const reference = referenceText(book, input.chapter, start, end);
    const verses: BiblePassageResult["verses"] = [];
    const missingVerses: BiblePassageResult["missingVerses"] = [];
    const notes: BiblePassageResult["notes"] = [];
    for (let number = start; number <= end; number++) {
      const text = target[String(number)];
      if (text === undefined) {
        throw new BibleLookupError("INVALID_REFERENCE", "No explicit verse mapping exists for this translation");
      }
      if (text === "") {
        missingVerses.push({ number, reason: "omitted_in_translation" });
        const omitted = referenceText(book, input.chapter, number, number);
        notes.push({ kind: "omission", reference: omitted,
          message: `${omitted} is not included in the main text of ${input.translation}.` });
      } else {
        verses.push({ number, text });
      }
    }
    if (mapping) notes.push({ kind: "verse_mapping", reference,
      message: `${requestedReference} in ${input.referenceTranslation} corresponds to ${reference} in ${input.translation}; the translations divide the text differently.` });
    return {
      requestedReference, reference, referenceTranslation: input.referenceTranslation,
      translation: input.translation, bookId: book.id, book: book.name,
      chapter: input.chapter, verseStart: start, verseEnd: end,
      provider: "bundled-bible", providerVersion: data.manifest.translations[input.translation].version,
      passageStatus: verses.length === 0 ? "unavailable" : missingVerses.length ? "partial" : "complete",
      verses, missingVerses, notes,
    };
  }

  /** Every verse a translation has text for, in canonical order. */
  function* verses(translation: BibleTranslation): Generator<VerseLocation & { text: string }> {
    requireTranslation(translation);
    for (const book of data.manifest.books) {
      for (const [chapter, chapterVerses] of Object.entries(data.assets[translation].books[String(book.id)] ?? {})) {
        for (const [verse, text] of Object.entries(chapterVerses)) {
          if (text) yield { bookId: book.id, chapter: Number(chapter), verse: Number(verse), text };
        }
      }
    }
  }

  function verseText(translation: BibleTranslation, location: VerseLocation): string | undefined {
    return data.assets[translation].books[String(location.bookId)]?.[String(location.chapter)]?.[String(location.verse)] || undefined;
  }

  /** "Psalm 23:1". */
  function citation(location: VerseLocation): string {
    const book = data.byId.get(location.bookId);
    return book ? referenceText(book, location.chapter, location.verse, location.verse) : "";
  }

  /** Whether a chapter such as "Psalm 23" or "1 John 4" exists. */
  function chapterExists(chapterName: string): boolean {
    const match = /^(.+?)\s+(\d+)$/.exec(chapterName.trim());
    const book = match ? data.byName.get(normalized(match[1]!)) : undefined;
    return !!book && Number(match![2]) >= 1 && Number(match![2]) <= book.chapterCount;
  }

  return {
    availableTranslations: [...BIBLE_TRANSLATIONS],
    parseReference,
    getPassage,
    verses,
    verseText,
    citation,
    chapterExists,
  };
}
