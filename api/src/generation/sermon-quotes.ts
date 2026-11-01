import { createBibleStore } from "../bible/bible-store.js";
import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { namedChapters } from "./scripture.js";
import { containsExcerpt, normalizeSourceText } from "./transcript.js";

// Readers never see the sermon quoted: its words are captions, which read
// badly, and the real sermon is the video. Scripture isn't the sermon's words,
// even when the sermon reads it, so quoting Scripture is fine.

/** This many of the sermon's words in a row, outside Scripture, copy it. */
const COPIED_WORDS = 12;
/** A copied run with this many words in a row from a verse is the sermon reading Scripture. */
const SCRIPTURE_WORDS = 6;
/** Words in quotation marks quote the sermon when it says them and there are at least this many. */
const QUOTED_WORDS = 3;
/** Words in quotation marks, straight or curly. */
const QUOTED = /["“„‟]([^"“”„‟]+)["”]/g;

let bible: ReturnType<typeof createBibleStore> | null = null;

/** What a sermon says, for telling its words from SundayBest's: its transcript, the Scripture it names, who preached it. */
export interface SermonWords {
  source: string;
  scripture: string;
  /** Every run of COPIED_WORDS of the sermon's words. */
  runs: ReadonlySet<string>;
  /** Words put in the pastor's or the sermon's mouth: "Mike Smith: “…”", "Pastor Mike said, “…”", "From the sermon: “…”". */
  attributed: RegExp;
}

export function sermonWords(input: PlanGenerationInput, speakerName: string | null): SermonWords {
  bible ??= createBibleStore();
  const store = bible;
  const source = input.transcriptSegments?.map((segment) => segment.text).join(" ") ?? input.transcript;
  const sermon = wordsOf(source);
  const runs = new Set<string>();
  for (let start = 0; start + COPIED_WORDS <= sermon.length; start++) runs.add(sermon.slice(start, start + COPIED_WORDS).join(" "));
  const names = ["From the sermon", "the sermon", "Pastor\\s+\\p{Lu}[\\p{L}'-]*(?:\\s+\\p{Lu}[\\p{L}'-]*)?", "the pastor",
    ...(speakerName ? [speakerName, ...speakerName.split(/\s+/).filter((part) => part.length > 2)].map(escaped) : [])];
  return {
    source: normalizeSourceText(source),
    scripture: namedChapters(source).map((chapter) => store.chapterText(chapter)).join(" "),
    runs,
    attributed: new RegExp(`(?:${names.join("|")})(?:\\s+(?:said|says|put it|told us|tells us))?\\s*[:,]\\s*["“„‟]([^"“”„‟]+)["”]`, "giu"),
  };
}

/** How a line SundayBest writes quotes the sermon, or null when it doesn't. */
export function quoteProblem(text: string, sermon: SermonWords): string | null {
  for (const [, words] of text.matchAll(sermon.attributed)) {
    if (!isScripture(words!, sermon)) return `quotes the sermon (“${opening(words!)}”)`;
  }
  for (const [, words] of text.matchAll(QUOTED)) {
    if (quotesSermon(words!, sermon)) return `quotes the sermon (“${opening(words!)}”)`;
  }
  const written = wordsOf(text);
  for (let start = 0; start + COPIED_WORDS <= written.length; start++) {
    const run = written.slice(start, start + COPIED_WORDS);
    if (sermon.runs.has(run.join(" ")) && !readsScripture(run, sermon)) return `copies the sermon word for word (“${opening(run.join(" "))}”)`;
  }
  return null;
}

/**
 * A line with its quotes of the sermon taken out: words put in the pastor's or
 * the sermon's mouth lose their name and marks, and the sermon's words in
 * quotation marks lose their marks, so they stand as plain words. Scripture
 * keeps its marks. `notes` says what was changed.
 */
export function withoutQuotes(text: string, sermon: SermonWords): { text: string; notes: string[] } {
  const notes: string[] = [];
  const unattributed = text.replace(sermon.attributed, (whole, words: string) => {
    if (isScripture(words, sermon)) return whole;
    notes.push(`A quote put in the sermon's mouth (“${opening(words)}”) was kept as plain words.`);
    return words;
  });
  const settled = unattributed.replace(QUOTED, (whole, words: string) => {
    if (!quotesSermon(words, sermon)) return whole;
    notes.push(`The sermon's words in quotation marks (“${opening(words)}”) were kept as plain words.`);
    return words;
  });
  return { text: settled, notes };
}

function quotesSermon(words: string, sermon: SermonWords): boolean {
  return wordsOf(words).length >= QUOTED_WORDS && containsExcerpt(sermon.source, words) && !isScripture(words, sermon);
}

/** Whether a run of the sermon's words is it reading Scripture: some SCRIPTURE_WORDS of them in a row are a verse's. */
function readsScripture(run: readonly string[], sermon: SermonWords): boolean {
  for (let start = 0; start + SCRIPTURE_WORDS <= run.length; start++) {
    if (isScripture(run.slice(start, start + SCRIPTURE_WORDS).join(" "), sermon)) return true;
  }
  return false;
}

function isScripture(words: string, sermon: SermonWords): boolean {
  return containsExcerpt(sermon.scripture, words);
}

function wordsOf(text: string): string[] {
  return normalizeSourceText(text).replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

function opening(words: string): string {
  const all = words.trim().split(/\s+/);
  return all.length > 6 ? `${all.slice(0, 6).join(" ")}…` : all.join(" ");
}

function escaped(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
