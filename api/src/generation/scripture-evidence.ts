import { createBibleStore } from "../bible/bible-store.js";
import { AppError } from "../http/errors.js";
import { createQuoteIndex } from "../bible/quote-index.js";
import { namedChapters } from "./scripture.js";

/** What a transcript shows of the Bible: the chapters it names and the verses it reads. */
export interface ScriptureEvidence {
  /** Chapters named that exist, as "Romans 8", in the order first named. */
  chapters: string[];
  /** Verses read aloud in the BSB or KJV wording, as "John 3:16". */
  quotedVerses: string[];
}

/**
 * Named chapters plus verses read, below which a video is not taken to teach
 * from the Bible. Measured on stored transcripts: two sermons scored 21 and 26;
 * a gaming video scored 0. A short message that names one passage and reads
 * three of its verses still passes.
 */
const MIN_SCRIPTURE_MENTIONS = 4;

let quotes: ReturnType<typeof createQuoteIndex> | null = null;

/** Built on first use, about two seconds, then kept for the life of the process. */
function quoteIndex() {
  quotes ??= createQuoteIndex(createBibleStore());
  return quotes;
}

export function findScriptureEvidence(source: string): ScriptureEvidence {
  const store = createBibleStore();
  return {
    chapters: namedChapters(source).filter((chapter) => store.chapterExists(chapter)),
    quotedVerses: quoteIndex().find(source).map((location) => store.citation(location)),
  };
}

/**
 * SundayBest builds Bible studies from sermons. A video that names no chapter
 * cannot give a day its passage, and one that barely touches Scripture — a
 * self-help talk quoting a verse, a video only titled as a sermon — is not one.
 */
export function teachesFromScripture(evidence: ScriptureEvidence): boolean {
  return evidence.chapters.length > 0 && evidence.chapters.length + evidence.quotedVerses.length >= MIN_SCRIPTURE_MENTIONS;
}

/** A video that does not teach from the Bible: it fails the same way every time, so it is never retried. */
export class NoScriptureError extends AppError {
  constructor() {
    super("SERMON_UNSUPPORTED", "The video does not teach from Scripture", { permanent: true });
    // AppError pins its own prototype; restore this one so `instanceof` can tell the cases apart.
    Object.setPrototypeOf(this, NoScriptureError.prototype);
  }
}
