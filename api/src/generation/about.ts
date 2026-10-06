import type { GeneratedAbout, GeneratedCitation } from "./schema.js";
import { canonicalizeCitation, referenceIsNamed, type ScriptureCitation, type ScriptureRange } from "./scripture.js";
import { containsExcerpt } from "./transcript.js";

/**
 * Maps About This Plan from model output. A listed Scripture is kept only when
 * its evidence is an exact transcript excerpt naming it; anything unverifiable
 * is left out rather than failing the plan. A day's passage the list leaves out
 * is added as its chapter: the transcript named that chapter, but not
 * necessarily the verses the day studies.
 */
interface RawAbout {
  overview: readonly string[];
  keyTakeaways: readonly string[];
  scripturesReferenced: ReadonlyArray<ScriptureCitation & { evidenceQuote: string }>;
}

export function mapAbout(raw: RawAbout, source: string, passages: readonly ScriptureRange[]): GeneratedAbout {
  const citations = new Map<string, GeneratedCitation>();
  for (const { evidenceQuote, ...fields } of raw.scripturesReferenced) {
    let citation: GeneratedCitation;
    try {
      citation = canonicalizeCitation(fields);
    } catch {
      continue;
    }
    if (!containsExcerpt(source, evidenceQuote) || !referenceIsNamed(evidenceQuote, citation)) continue;
    citations.set(citation.reference, citation);
  }
  for (const passage of passages) {
    const listed = [...citations.values()].some((citation) => citation.book === passage.book && citation.chapter === passage.chapter);
    if (listed) continue;
    const chapter = canonicalizeCitation({ book: passage.book, chapter: passage.chapter, verseStart: null, verseEnd: null, reference: `${passage.book} ${passage.chapter}` });
    citations.set(chapter.reference, chapter);
  }
  return {
    overview: raw.overview.map((paragraph) => paragraph.trim()),
    keyTakeaways: raw.keyTakeaways.map((takeaway) => takeaway.trim()),
    scripturesReferenced: [...citations.values()],
  };
}
