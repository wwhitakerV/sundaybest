/** At this width and wider (in points, at the default text size), the words sit clear enough of the art. */
const CLEAR_FROM = 345;
/** At this width and narrower, the art under the words is covered fully. */
const FULL_AT = 305;

/**
 * How fully the Quick Play card's own gradient should cover the art behind
 * its words (0–1). Its art scales with the card but its words don't, so what
 * matters is the card's width against the text size: a narrower card, or
 * larger Dynamic Type, crowds the words onto the character cards. None on a
 * card wide enough, all on one too narrow, and eased in between — never a
 * jump as the width changes.
 */
export function getWordsCover({ cardWidth, fontScale }: { cardWidth: number; fontScale: number }) {
  if (cardWidth <= 0) return 0;
  const width = cardWidth / fontScale;
  return Math.min(1, Math.max(0, (CLEAR_FROM - width) / (CLEAR_FROM - FULL_AT)));
}
