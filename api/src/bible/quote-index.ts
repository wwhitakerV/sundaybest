import type { createBibleStore } from "./bible-store.js";
import { BIBLE_TRANSLATIONS, type VerseLocation } from "./types.js";

type BibleStore = ReturnType<typeof createBibleStore>;

/** Words in a row that must match a verse to count as reading it: enough that everyday speech does not. */
const WINDOW = 8;
/** A run of words found in more verses than this is a stock phrase, not a quotation. */
const MAX_VERSES_PER_PHRASE = 3;
// Each entry packs a 29-bit phrase hash above a 24-bit verse id, which fits a
// float exactly, so the whole index is one sorted Float64Array (about 8 MB).
const ID_SPACE = 2 ** 24;

/** Lowercase words without punctuation; KJV's bracketed words are kept as words. */
export function quoteWords(text: string): string[] {
  return text.normalize("NFKC").toLowerCase().replace(/[’‘']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean);
}

function phraseHash(phrase: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < phrase.length; index++) hash = Math.imul(hash ^ phrase.charCodeAt(index), 0x01000193);
  return (hash >>> 0) >>> 3;
}

function packId(translation: number, location: VerseLocation): number {
  return (translation << 23) | (location.bookId << 16) | (location.chapter << 8) | location.verse;
}

function unpackId(id: number): { translation: number; location: VerseLocation } {
  return { translation: id >>> 23, location: { bookId: (id >>> 16) & 0x7f, chapter: (id >>> 8) & 0xff, verse: id & 0xff } };
}

/**
 * Finds verses read aloud: every eight-word run of every bundled verse is
 * indexed, and a transcript's runs are looked up and then checked word for
 * word against the verse, so a hash collision is never counted.
 */
export function createQuoteIndex(store: BibleStore) {
  const entries: number[] = [];
  BIBLE_TRANSLATIONS.forEach((translation, translationIndex) => {
    for (const verse of store.verses(translation)) {
      const words = quoteWords(verse.text);
      const id = packId(translationIndex, verse);
      for (let start = 0; start + WINDOW <= words.length; start++) {
        entries.push(phraseHash(words.slice(start, start + WINDOW).join(" ")) * ID_SPACE + id);
      }
    }
  });
  const index = Float64Array.from(entries).sort();

  function candidates(hash: number): number[] {
    const low = hash * ID_SPACE;
    let start = 0;
    let end = index.length;
    while (start < end) {
      const middle = (start + end) >>> 1;
      if (index[middle]! < low) start = middle + 1;
      else end = middle;
    }
    const ids: number[] = [];
    for (let at = start; at < index.length && index[at]! < low + ID_SPACE; at++) ids.push(index[at]! - low);
    return ids;
  }

  return {
    /** Each verse the text reads from, once, in the order first read. */
    find(text: string): VerseLocation[] {
      const words = quoteWords(text);
      const found = new Map<string, VerseLocation>();
      for (let start = 0; start + WINDOW <= words.length; start++) {
        const phrase = words.slice(start, start + WINDOW).join(" ");
        const verses = new Map<string, VerseLocation>();
        for (const id of candidates(phraseHash(phrase))) {
          const { translation, location } = unpackId(id);
          const verse = store.verseText(BIBLE_TRANSLATIONS[translation]!, location);
          if (verse && ` ${quoteWords(verse).join(" ")} `.includes(` ${phrase} `)) verses.set(store.citation(location), location);
        }
        if (verses.size > MAX_VERSES_PER_PHRASE) continue;
        for (const [citation, location] of verses) if (!found.has(citation)) found.set(citation, location);
      }
      return [...found.values()];
    },
  };
}
