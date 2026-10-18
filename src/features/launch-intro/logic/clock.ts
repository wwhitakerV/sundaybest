/** The moments the clock watches for: haptics on two, the page revealed, the intro over. */
export type ClockMoments = {
  firstHit: number;
  splashStart: number;
  revealAt: number;
  doneAt: number;
};

/**
 * Which moments one frame of the clock passed, from `before` to `next`. The page
 * is revealed and the intro done only strictly past their moments, so a clock
 * waiting at the end of the hold for the page is still covering it.
 */
export function clockCrossings(before: number, next: number, moments: ClockMoments) {
  "worklet";
  const crossed = (at: number) => before < at && next >= at;
  const past = (at: number) => before <= at && next > at;
  return {
    drop: crossed(moments.firstHit),
    splash: crossed(moments.splashStart),
    reveal: past(moments.revealAt),
    done: past(moments.doneAt),
  };
}
