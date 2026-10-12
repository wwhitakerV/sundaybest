/**
 * The most the intro's clock moves in one frame: about two frames at 60Hz. A
 * frame that stalls longer (the app busy starting up) pauses the pen for a
 * moment instead of skipping past what it would have drawn.
 */
export const MAX_FRAME_MS = 34;

/** How many on-time frames in a row show the canvas is drawing, before the clock starts. */
export const SETTLE_FRAMES = 3;

/** The longest the clock waits for on-time frames: a slow phone still gets its intro. */
export const SETTLE_LIMIT_MS = 500;

/**
 * The blank beat before the pen touches down: the clock starts this far before
 * zero, so the last of the launch's start-up lands on the empty page — and the
 * liquid's filter warms up there (`Frame.warming`), not during the first drips.
 */
export const PREROLL_MS = 150;

/**
 * The intro's time after one more frame of `dt` ms: never more than
 * `MAX_FRAME_MS` at once, and never backwards. It waits at the end of the
 * full-colour hold until the page underneath is ready, so the page never
 * arrives before it's there.
 */
export function advanceClock(
  t: number,
  dt: number,
  { ready, holdEnd }: { ready: boolean; holdEnd: number },
): number {
  "worklet";
  const next = t + Math.min(Math.max(0, dt), MAX_FRAME_MS);
  if (!ready && next > holdEnd) return Math.max(t, holdEnd);
  return next;
}

/** The run of on-time frames after one more frame of `dt` ms: a stalled frame starts it again. */
export function smoothFrames(count: number, dt: number): number {
  "worklet";
  return dt <= MAX_FRAME_MS ? count + 1 : 0;
}

/**
 * Whether the clock can start: a few on-time frames in a row (the canvas is
 * drawing), or, on a phone whose frames never come on time, once it has waited
 * `SETTLE_LIMIT_MS` — it never waits for good.
 */
export function canStart(smooth: number, waitedMs: number): boolean {
  "worklet";
  return smooth >= SETTLE_FRAMES || waitedMs >= SETTLE_LIMIT_MS;
}
