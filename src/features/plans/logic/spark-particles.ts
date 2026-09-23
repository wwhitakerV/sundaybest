const PARTICLE_COUNT_MIN = 7;
const PARTICLE_COUNT_MAX = 8;

// Fast, but long enough for particles to visibly travel hundreds of pixels
// across the screen before disappearing.
const DURATION_MIN = 280;
const DURATION_MAX = 520;
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.35;

// Origins are spread across the StudyNav capsule so the burst reads as coming
// from the nav itself instead of one artificial center point.
const ORIGIN_X_MIN_PERCENT = 12;
const ORIGIN_X_MAX_PERCENT = 88;
const ORIGIN_Y_MIN_PERCENT = 14;
const ORIGIN_Y_MAX_PERCENT = 72;

export type SparkParticle = {
  id: number;
  originXPercent: number;
  originYPercent: number;
  endX: number;
  endY: number;
  duration: number;
  scale: number;
  rotationDeg: number;
};

/** A source of numbers in [0, 1). `Math.random` in the app; seeded in tests. */
export type RandomSource = () => number;

function randomBetween(random: RandomSource, min: number, max: number): number {
  return min + random() * (max - min);
}

/**
 * One burst's particles, each with its own origin, trajectory, endpoint,
 * duration, scale, and rotation so the motion never reads as one
 * synchronized group. Pure given `random`.
 */
export function makeSparkParticles(
  screenWidth: number,
  screenHeight: number,
  random: RandomSource = Math.random,
): SparkParticle[] {
  const count = Math.round(randomBetween(random, PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX));

  return Array.from({ length: count }, (_, id) => {
    const originXPercent = randomBetween(random, ORIGIN_X_MIN_PERCENT, ORIGIN_X_MAX_PERCENT);
    const originYPercent = randomBetween(random, ORIGIN_Y_MIN_PERCENT, ORIGIN_Y_MAX_PERCENT);

    // Each spark travels a meaningful fraction of the viewport, away from the
    // side it started on and always upward.
    const horizontalDirection = originXPercent < 50 ? -1 : 1;
    const horizontalDistance = randomBetween(random, screenWidth * 0.18, screenWidth * 0.72);
    const verticalDistance = randomBetween(random, screenHeight * 0.28, screenHeight * 0.66);

    const endX = horizontalDirection * horizontalDistance;
    const endY = -verticalDistance;

    // Align the vertical streak with its direction of travel: atan2 measures
    // from the x-axis, so add 90deg.
    const rotationDeg = (Math.atan2(endY, endX) * 180) / Math.PI + 90;

    return {
      id,
      originXPercent,
      originYPercent,
      endX,
      endY,
      duration: randomBetween(random, DURATION_MIN, DURATION_MAX),
      scale: randomBetween(random, SCALE_MIN, SCALE_MAX),
      rotationDeg,
    };
  });
}
