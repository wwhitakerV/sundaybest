import type { GeneratedCitation, GeneratedSupportingScripture } from "./schema.js";
import { canonicalizeScripture, type ScriptureRange } from "./scripture.js";

const MAX_SUPPORTING_VERSES = 10;

type RawSupporting = ScriptureRange & { connection: string };

/**
 * A day's supporting Scripture, kept apart from what the sermon itself cites.
 * Left out rather than failing the plan: an unknown book, a passage over ten
 * verses, a repeat, or anything overlapping Scripture the sermon names — that
 * belongs to the sermon's own content.
 */
export function mapSupporting(raw: readonly RawSupporting[], sermonNamed: readonly (GeneratedCitation | ScriptureRange)[]): GeneratedSupportingScripture[] {
  const kept = new Map<string, GeneratedSupportingScripture>();
  for (const passage of raw) {
    let canonical: ScriptureRange;
    try {
      canonical = canonicalizeScripture(passage);
    } catch {
      continue;
    }
    if (canonical.verseEnd - canonical.verseStart + 1 > MAX_SUPPORTING_VERSES) continue;
    if (sermonNamed.some((named) => overlaps(named, canonical))) continue;
    if (!kept.has(canonical.reference)) kept.set(canonical.reference, { ...canonical, connection: passage.connection.trim() });
  }
  return [...kept.values()];
}

/** Both sides are canonical, so books compare directly. A whole-chapter citation overlaps every verse in it. */
function overlaps(named: GeneratedCitation | ScriptureRange, passage: ScriptureRange): boolean {
  if (named.book !== passage.book || named.chapter !== passage.chapter) return false;
  if (named.verseStart === null || named.verseEnd === null) return true;
  return named.verseStart <= passage.verseEnd && passage.verseStart <= named.verseEnd;
}
