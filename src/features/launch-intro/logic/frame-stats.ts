/**
 * How smoothly the intro played, beat by beat, for the development log: each
 * frame's time added to the beat it fell in, so the heaviest beat shows itself.
 */

/** Past this, a frame missed a 60Hz screen's refresh: it ran slow. */
export const SLOW_FRAME_MS = 17;

type BeatFrames = { frames: number; total: number; worst: number; slow: number };
export type FrameStats = Readonly<Record<string, BeatFrames>>;

/** The beat moment `t` falls in; `lead-in` before the intro starts, `after` past its last beat. */
export function beatAt(beats: readonly { key: string; start: number; end: number }[], t: number) {
  "worklet";
  if (t < 0) return "lead-in";
  for (const beat of beats) if (t >= beat.start && t < beat.end) return beat.key;
  return "after";
}

/** The tally with one more frame of `dt` ms in beat `key`; the tally given is left as it was. */
export function recordFrame(stats: FrameStats, key: string, dt: number): FrameStats {
  "worklet";
  const was = stats[key] ?? { frames: 0, total: 0, worst: 0, slow: 0 };
  return {
    ...stats,
    [key]: {
      frames: was.frames + 1,
      total: was.total + dt,
      worst: Math.max(was.worst, dt),
      slow: was.slow + (dt > SLOW_FRAME_MS ? 1 : 0),
    },
  };
}

/** One line a beat: its average and worst frame time, and how many of its frames ran slow. */
export function summarizeFrames(stats: FrameStats): string[] {
  return Object.entries(stats).map(
    ([key, b]) =>
      `${key}: avg ${(b.total / b.frames).toFixed(1)}ms, worst ${b.worst.toFixed(1)}ms, ${b.slow}/${b.frames} slow`,
  );
}

/** An intro's beats as a list, in order, for `beatAt`. */
export function beatList(beats: Readonly<Record<string, { start: number; end: number }>>) {
  return Object.entries(beats).map(([key, { start, end }]) => ({ key, start, end }));
}
