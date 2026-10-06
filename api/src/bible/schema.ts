import { z } from "zod";

import { BIBLE_TRANSLATIONS } from "./types.js";

// The bundled files are checked against the manifest's hashes, but the manifest
// itself is not hashed: both are parsed here, never cast.

const translation = z.enum(BIBLE_TRANSLATIONS);

const translationManifest = z.object({
  name: z.string().min(1),
  file: z.string().min(1),
  contentSha256: z.string().regex(/^[0-9a-f]{64}$/),
  version: z.string().min(1),
  bookCount: z.number().int().positive(),
  chapterCount: z.number().int().positive(),
  verseEntryCount: z.number().int().positive(),
  nonemptyVerseCount: z.number().int().nonnegative(),
  omittedVerses: z.array(z.object({ bookId: z.number().int(), chapter: z.number().int(), verse: z.number().int() })),
});

export const bibleManifestSchema = z.object({
  schemaVersion: z.literal(1),
  books: z.array(z.object({
    id: z.number().int().min(1).max(66),
    name: z.string().min(1),
    displayName: z.string().min(1),
    aliases: z.array(z.string().min(1)),
    chapterCount: z.number().int().positive(),
  })).length(66),
  translations: z.object({ BSB: translationManifest, KJV: translationManifest }),
  verseMappings: z.array(z.object({
    bookId: z.number().int(),
    chapter: z.number().int(),
    fromTranslation: translation,
    toTranslation: translation,
    fromVerseStart: z.number().int(),
    fromVerseEnd: z.number().int(),
    toVerseStart: z.number().int(),
    toVerseEnd: z.number().int(),
  })),
});

export const bibleAssetSchema = z.object({
  schemaVersion: z.literal(1),
  translation,
  books: z.record(z.string(), z.record(z.string(), z.record(z.string(), z.string()))),
});
