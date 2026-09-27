/** Of the content under the artwork, how much the content's colour takes to come in. */
const FADE_RATIO = 0.75;
/** How much of the artwork, from its bottom up, the content's colour starts over. */
const LIFT_RATIO = 1 / 8;

/**
 * Where a hero's content colour comes in, in points down the hero: clear an
 * eighth of the way up the artwork, solid three quarters of the way down the
 * content under it (raised by as much) — so the words sit on the sermon's
 * colour, reaching softly up over the artwork's lower part. None until the
 * hero's measured (`heroHeight` 0).
 */
export function getHeroContentFade({
  artworkBottom,
  artworkHeight,
  heroHeight,
}: {
  artworkBottom: number;
  artworkHeight: number;
  heroHeight: number;
}): { from: number; to: number } | null {
  if (heroHeight <= artworkBottom) return null;
  const lift = artworkHeight * LIFT_RATIO;
  return {
    from: artworkBottom - lift,
    to: artworkBottom + (heroHeight - artworkBottom) * FADE_RATIO - lift,
  };
}
