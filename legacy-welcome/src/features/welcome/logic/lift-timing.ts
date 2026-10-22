/**
 * The timing of each card's turn on stage — its lifts, the scroll before
 * them, and the turn's length — as pure functions of how long it has been
 * playing (ms from the start of the card's beat). Each piece's own scene is in
 * `scenes`.
 *
 * A turn: the card takes the stage, then one or more pieces of its UI lift
 * off the phone in turn — each jumps into the foreground, plays its little
 * scene there, and snaps back onto the phone — before the next card goes.
 *
 * A piece's scene is written as if its lift were the turn's only one, timed
 * from the turn's start (`LIFTED_AT_MS` onward); `getLiftElapsedMs` shifts a
 * later lift's clock to match. Before its lift a piece is at 0ms; once the
 * card's turn is over it is at `Infinity`.
 */

// ---------------------------------------------------------------------------
// The lift: the same off-and-back-on for every piece
// ---------------------------------------------------------------------------

/**
 * The phone navigating between screens, as iOS does: a push slides in from
 * the right, a full-screen modal slides up. (Stepping within a screen is the
 * app's own `useStepTransition`, ~260ms.)
 */
export const NAVIGATION_MS = { push: 450, modal: 500 } as const;

export const LIFT = {
  /** Waits for the phone to finish navigating to the screen (`NAVIGATION_MS`) and settle. */
  startMs: 600,
  /** Jumping off the phone into the foreground. */
  outMs: 420,
  /** Snapping back down onto the phone. */
  backMs: 380,
  /** Slack after the snap-back, so the hand-off happens once it has landed. */
  handoffMs: 60,
  /** Between one piece landing back and the next lifting, on a turn with several. */
  gapMs: 200,
  /** A beat of stillness before the next card takes the stage. */
  tailMs: 150,
} as const;

/** When a (first) piece is up and its scene can start. */
export const LIFTED_AT_MS = LIFT.startMs + LIFT.outMs;

export type LiftState = {
  /** The foreground copy exists (and the phone's own copy is hidden). */
  overlay: boolean;
  /** It's up in the foreground — false while it travels back down. */
  lifted: boolean;
};

/** Where a lift is, on its own clock, for a piece whose scene plays for `sceneMs`. */
export function getLiftState(elapsedMs: number, sceneMs: number): LiftState {
  const returnAtMs = LIFTED_AT_MS + sceneMs;
  const landedAtMs = returnAtMs + LIFT.backMs + LIFT.handoffMs;
  const started = elapsedMs >= LIFT.startMs;
  return {
    overlay: started && elapsedMs < landedAtMs,
    lifted: started && elapsedMs < returnAtMs,
  };
}

/**
 * One lift of a turn: how long its scene plays once the piece is up; how long
 * to wait before it lifts (`leadMs` — for the screen to scroll the piece into
 * view first, on a turn whose pieces aren't all on screen); and any extra
 * stillness after it lands back (`afterMs`) before the story moves on.
 *
 * `waitMs` holds still before the lead-in, for the screen to finish arriving.
 */
export type LiftSpec = { sceneMs: number; waitMs?: number; leadMs?: number; afterMs?: number };

/** Scrolling a piece into view before it lifts: the scroll, then a beat to settle. */
export const SCROLL = { durationMs: 700, leadMs: 850 } as const;

/** How long one lift takes, from leaving the phone to the hand-off back. */
function getLiftSpanMs(sceneMs: number): number {
  return LIFT.outMs + sceneMs + LIFT.backMs + LIFT.handoffMs;
}

/** When each of a turn's lifts starts, from the turn's start (after its wait and lead-in). */
function getLiftStartsMs(lifts: readonly LiftSpec[]): number[] {
  let cursorMs = LIFT.startMs;
  return lifts.map(({ sceneMs, waitMs = 0, leadMs = 0, afterMs = 0 }) => {
    const startMs = cursorMs + waitMs + leadMs;
    cursorMs = startMs + getLiftSpanMs(sceneMs) + afterMs + LIFT.gapMs;
    return startMs;
  });
}

/**
 * The clock lift `index` of a turn plays on: shifted so that lift starts at
 * `LIFT.startMs`, the same as a turn's first. A piece's scene is written
 * against that, whichever lift of the turn it is.
 */
export function getLiftElapsedMs(
  turnElapsedMs: number,
  lifts: readonly LiftSpec[],
  index: number,
): number {
  const startMs = getLiftStartsMs(lifts).at(index) ?? LIFT.startMs;
  return Math.max(0, turnElapsedMs - startMs + LIFT.startMs);
}

/** The lift under way in a turn, if any: which one, and where it is on its own clock. */
export type ActiveLift = { index: number; elapsedMs: number; state: LiftState };

export function getActiveLift(
  turnElapsedMs: number,
  lifts: readonly LiftSpec[],
): ActiveLift | null {
  for (const [index, { sceneMs }] of lifts.entries()) {
    const elapsedMs = getLiftElapsedMs(turnElapsedMs, lifts, index);
    const state = getLiftState(elapsedMs, sceneMs);
    if (state.overlay) return { index, elapsedMs, state };
  }
  return null;
}

/**
 * Which lift's piece the screen should be scrolled to: the latest lift whose
 * lead-in has begun, among those that have one. Null before any — the screen
 * sits at the top.
 */
export function getScrollTargetIndex(
  turnElapsedMs: number,
  lifts: readonly LiftSpec[],
): number | null {
  const starts = getLiftStartsMs(lifts);
  let target: number | null = null;
  for (const [index, { leadMs = 0 }] of lifts.entries()) {
    const leadStartMs = (starts.at(index) ?? 0) - leadMs;
    if (leadMs > 0 && turnElapsedMs >= leadStartMs) target = index;
  }
  return target;
}

/** How long a card's whole turn takes, all its lifts (and lead-ins) included. */
export function getTurnMs(lifts: readonly LiftSpec[]): number {
  const starts = getLiftStartsMs(lifts);
  const lastStart = starts.at(-1) ?? LIFT.startMs;
  const last = lifts.at(-1);
  return lastStart + getLiftSpanMs(last?.sceneMs ?? 0) + (last?.afterMs ?? 0) + LIFT.tailMs;
}
