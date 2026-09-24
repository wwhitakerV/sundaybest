import type { BurstStreak } from "./makeBurstStreaks";

export type RadialStreaksOptions = {
  count: number;
  /** Where the fan points, in degrees: 0 is up, 90 is right, -90 is left. */
  centerDeg: number;
  /** Total width of the fan in degrees, centred on `centerDeg`. */
  spreadDeg: number;
  /** How far the long streaks travel, and how long they are at launch. */
  reach: number;
  length: number;
  /** How much of the long reach and length the short streaks get (0–1). */
  shortRatio: number;
};

/**
 * An evenly spaced, symmetric fan of line streaks pointing in any direction,
 * each travelling the same distance — for a burst out of one side of
 * something. Streaks alternate long/short, starting and ending long. A
 * single streak points straight along `centerDeg`.
 */
export function makeRadialStreaks({
  count,
  centerDeg,
  spreadDeg,
  reach,
  length,
  shortRatio,
}: RadialStreaksOptions): BurstStreak[] {
  if (count <= 0) return [];
  const step = count > 1 ? spreadDeg / (count - 1) : 0;
  const start = count > 1 ? centerDeg - spreadDeg / 2 : centerDeg;

  return Array.from({ length: count }, (_, index) => {
    const ratio = index % 2 === 0 ? 1 : shortRatio;
    return { angleDeg: start + step * index, reach: reach * ratio, length: length * ratio };
  });
}
