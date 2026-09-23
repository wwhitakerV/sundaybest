export type BurstStreak = {
  /** Direction of travel in degrees; 0 is straight up, negative leans left. */
  angleDeg: number;
  /** How far from the origin the streak's centre travels, in points. */
  reach: number;
  /** Streak length at launch, in points. */
  length: number;
};

export type BurstOptions = {
  count: number;
  /** Total width of the fan in degrees, centred on straight up. */
  spreadDeg: number;
  /** How high above the origin the long streaks end, whatever their angle. */
  longRise: number;
  longLength: number;
  /** How high above the origin the short streaks end. */
  shortRise: number;
  shortLength: number;
};

/**
 * An evenly spaced, symmetric fan of line streaks pointing upward from one
 * origin. Streaks alternate long/short, starting and ending long, so the
 * burst has rhythm without any randomness. Each streak's `reach` is set so
 * it ends exactly `longRise`/`shortRise` above the origin — angled streaks
 * travel further — which lets a caller guarantee every streak finishes
 * clear of something above the origin. A single streak points straight up.
 */
export function makeBurstStreaks({
  count,
  spreadDeg,
  longRise,
  longLength,
  shortRise,
  shortLength,
}: BurstOptions): BurstStreak[] {
  if (count <= 0) return [];
  const step = count > 1 ? spreadDeg / (count - 1) : 0;
  const start = count > 1 ? -spreadDeg / 2 : 0;

  return Array.from({ length: count }, (_, index) => {
    const angleDeg = start + step * index;
    const isLong = index % 2 === 0;
    const rise = isLong ? longRise : shortRise;

    return {
      angleDeg,
      reach: rise / Math.cos((angleDeg * Math.PI) / 180),
      length: isLong ? longLength : shortLength,
    };
  });
}
