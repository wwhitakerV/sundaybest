import type { BibleTranslation } from "@/types/domain";

/** The verse Text size previews, in each translation SundayBest serves (from its bundled Bibles). */
const BSB =
  "Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.";
const KJV =
  "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.";

/**
 * Text size's preview: Philippians 4:6 in the reader's translation, as the
 * Daily Study would show it. A translation SundayBest doesn't serve falls back
 * to the Berean Standard Bible, as the server does.
 */
export function previewPassage(translation: BibleTranslation) {
  const kjv = translation === "KJV";
  return {
    reference: "Philippians 4:6",
    translation: kjv ? "KJV" : "BSB",
    verse: 6,
    text: kjv ? KJV : BSB,
  } as const;
}
