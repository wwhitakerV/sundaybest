/**
 * Every lift piece — the bit of a mock screen that jumps off the phone on
 * its turn — takes the same single prop, so the copy on the phone and the
 * copy in the foreground always show exactly the same moment.
 */
export type LiftPieceProps = {
  /** How far into its card's turn the story is (0 before, `Infinity` after). */
  elapsedMs: number;
};
