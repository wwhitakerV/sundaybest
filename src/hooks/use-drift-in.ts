import { useEffect, useRef } from "react";
import {
  Easing,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/** Calm, for reading: each part settles over this long, the next starting this far behind it. */
const DRIFT = { durationMs: 650, staggerMs: 160 } as const;

/**
 * How far a part has settled into place (0–1). In place on its first
 * showing — nothing moves as a screen arrives — then, each time `revealKey`
 * changes, in again from nothing, `order` parts behind the first. Held at 1
 * when `still`.
 */
export function useDriftIn(revealKey: unknown, order: number, still: boolean): SharedValue<number> {
  const progress = useSharedValue(1);
  const shownKey = useRef(revealKey);

  useEffect(() => {
    if (still || shownKey.current === revealKey) {
      progress.set(1);
      return;
    }
    shownKey.current = revealKey;
    progress.set(0);
    progress.set(
      withDelay(
        order * DRIFT.staggerMs,
        withTiming(1, { duration: DRIFT.durationMs, easing: Easing.out(Easing.cubic) }),
      ),
    );
  }, [revealKey, order, still, progress]);

  return progress;
}
