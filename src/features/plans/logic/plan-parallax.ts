/**
 * Plan Detail's hero as it scrolls, the way Apple lays out a show: the
 * artwork held back behind the page, rising at half the scroll, while the
 * hero's words and the list move with the finger over it. Worklets: they
 * run on the UI thread, with the scroll.
 */

/** How much of the scroll the artwork rises by. */
const ARTWORK_RATE = 0.5;
/** How far the page scrolls while the artwork fades — slowly. */
const ARTWORK_FADE_RANGE = 300;
/** How faint it gets: never gone. */
const ARTWORK_MIN_OPACITY = 0.2;
/** How far the page scrolls while the artwork shrinks — slower still. */
const ARTWORK_SCALE_RANGE = 450;
/** How small it gets: 15% smaller at most. */
const ARTWORK_MIN_SCALE = 0.85;

/** How far down to hold the artwork against the scroll, so it rises at half the rate — and follows the page down, half as far, when pulled past the top. */
export function getArtworkDrift(scrolled: number): number {
  "worklet";
  return scrolled * (1 - ARTWORK_RATE);
}

/**
 * Whether the hero's Continue has scrolled up level with the nav buttons —
 * the point it hands over to the tab bar (and back, scrolling down past it).
 * `continueTop` is its place down the page; `navTop` the nav buttons' down
 * the screen. Never before its place is known.
 */
export function isContinueHandedOff(
  scrolled: number,
  continueTop: number,
  navTop: number,
): boolean {
  "worklet";
  return continueTop > 0 && continueTop - scrolled <= navTop;
}

/** The artwork fading slowly as the page scrolls, never quite gone — and whole when pulled past the top. */
export function getArtworkOpacity(scrolled: number): number {
  "worklet";
  const progress = Math.min(1, Math.max(0, scrolled / ARTWORK_FADE_RANGE));
  return 1 - (1 - ARTWORK_MIN_OPACITY) * progress;
}

/** The artwork shrinking slowly as the page scrolls, to 85% at most — and whole when pulled past the top. */
export function getArtworkScale(scrolled: number): number {
  "worklet";
  const progress = Math.min(1, Math.max(0, scrolled / ARTWORK_SCALE_RANGE));
  return 1 - (1 - ARTWORK_MIN_SCALE) * progress;
}
