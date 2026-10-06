import type { BibleTranslation } from "@/types/domain";

/**
 * The translations SundayBest serves: the public-domain ones bundled with the
 * API. NIV, ESV and NLT need a licensed provider, and the server rejects them
 * without one.
 */
export const BIBLE_TRANSLATION_CHOICES = [
  { value: "BSB", label: "BSB", detail: "Berean Standard Bible" },
  { value: "KJV", label: "KJV", detail: "King James Version" },
] as const satisfies readonly { value: BibleTranslation; label: string; detail: string }[];

/** Matches the server's default for a new user. */
export const DEFAULT_BIBLE_TRANSLATION: BibleTranslation = "BSB";
