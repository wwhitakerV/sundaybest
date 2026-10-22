// The 99's own haptics, taken out of src/core/haptics/haptics.ts when the game
// was retired. Put back there (they use its `fine` module and `quietly`) to bring it back.

/** How hard The 99's call pulses land, from a tap's to a full call's. */
const CALL_INTENSITY = { least: 0.25, most: 0.85 };
/** The lock-on's double tap: the second this long after the first. */
const LOCK_GAP_MS = 90;

/**
 * One pulse of The 99's call, at `strength` (0–1): harder as the call grows.
 * On a build without our haptics module, the selection tick stands in — the
 * quickening rhythm still comes through, the growing weight doesn't.
 */
export function callFeedback(strength: number): void {
  const intensity =
    CALL_INTENSITY.least + (CALL_INTENSITY.most - CALL_INTENSITY.least) * Math.min(1, strength);
  quietly(fine ? fine.tap(intensity) : Haptics.selectionAsync());
}

/** The 99's wolf locking on to a sheep: a subtle double tap, to be felt without looking. */
export function lockFeedback(): void {
  selectionFeedback();
  setTimeout(selectionFeedback, LOCK_GAP_MS);
}
