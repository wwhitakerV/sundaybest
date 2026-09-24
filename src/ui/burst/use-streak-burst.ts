import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import type { BurstStreak } from "@/utils/burst/makeBurstStreaks";

/** One burst, launch to gone. (On a tab icon it ends just before the coin-spin lands.) */
const BURST_DURATION_MS = 460;
const BURST_EASING = Easing.out(Easing.cubic);
/** Streaks grow to full length over this first part of the flight… */
const GROW_UNTIL = 0.2;
/** …hold full opacity until here, then fade out by the end. */
const FADE_FROM = 0.65;
/** How much of its length a streak keeps at the end of the flight. */
const END_LENGTH_SCALE = 0.15;

/**
 * Drives one burst each time `trigger` changes to a new non-null value; null
 * means nothing to burst for (yet). Returns the shared 0→1 progress that
 * every streak reads, so the whole fan moves as one crisp gesture.
 */
export function useStreakBurst(trigger: string | number | null): SharedValue<number> {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (trigger === null) return;
    progress.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: BURST_DURATION_MS, easing: BURST_EASING }),
    );
  }, [trigger, progress]);

  return progress;
}

/**
 * One streak's motion, split in two so no transform order is relied on:
 *
 * - `travelStyle` (translate only) moves the streak's centre from the burst's
 *   origin out along its angle to its `reach`. The x/y offsets
 *   are computed here rather than by rotating then translating.
 * - `lengthStyle` (scaleY only, applied inside a view that's statically
 *   rotated to the streak's angle) grows the line almost at once, then thins
 *   it toward its tip as it slows.
 *
 * Invisible at rest (progress 0 before a burst, 1 after).
 */
export function useBurstStreakStyles(progress: SharedValue<number>, streak: BurstStreak) {
  const angleRad = (streak.angleDeg * Math.PI) / 180;
  const unitX = Math.sin(angleRad);
  const unitY = -Math.cos(angleRad);

  const travelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const distance = streak.reach * p;
    const opacity =
      p <= 0 || p >= 1 ? 0 : p < FADE_FROM ? 1 : 1 - (p - FADE_FROM) / (1 - FADE_FROM);

    return {
      opacity,
      transform: [{ translateX: unitX * distance }, { translateY: unitY * distance }],
    };
  });

  const lengthStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const scale =
      p < GROW_UNTIL
        ? p / GROW_UNTIL
        : 1 - ((p - GROW_UNTIL) / (1 - GROW_UNTIL)) * (1 - END_LENGTH_SCALE);

    return { transform: [{ scaleY: scale }] };
  });

  return { travelStyle, lengthStyle };
}
