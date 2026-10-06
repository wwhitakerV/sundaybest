import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import type { ScriptureRange } from "./scripture.js";

/**
 * A day's passage must read in every bundled translation a user can choose. A
 * translation may omit a verse (the BSB omits 16), so the full range need only
 * exist in one of them; the provider rejects a passage with no text at all.
 */
export async function assertPassageReads(scripture: ScriptureRange, bible: BibleProvider): Promise<void> {
  const expected = Array.from({ length: scripture.verseEnd - scripture.verseStart + 1 }, (_, i) => scripture.verseStart + i);
  let complete = false;
  for (const translation of bible.bundledTranslations) {
    const passage = await bible.getPassage({ reference: scripture.reference, translation });
    complete ||= passage.verses.length === expected.length && passage.verses.every((verse, index) => verse.number === expected[index] && verse.text.trim());
  }
  if (!complete) throw new AppError("INTERNAL", "Bible provider did not return the complete requested verse range");
}

/** Whether a passage has text in every bundled translation; supporting Scripture without it is left out. */
export async function readsInEveryBundledTranslation(reference: string, bible: BibleProvider): Promise<boolean> {
  try {
    for (const translation of bible.bundledTranslations) await bible.getPassage({ reference, translation });
    return true;
  } catch {
    return false;
  }
}
