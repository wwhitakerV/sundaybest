import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** It starts this small, and springs up past full size before settling. */
const START_SCALE = 0.6;
const SPRING = { damping: 14, stiffness: 160, mass: 0.8 };

/**
 * Text that springs out: each time `key` changes to a new non-null value it
 * starts small and transparent, then fades in as it springs up to size —
 * overshooting a touch and settling. A `null` key hides it. `delayMs`
 * staggers a group.
 */
export function useSpringIn(key: string | null, delayMs = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (key === null) {
      progress.value = withTiming(0, { duration: 150 });
      return;
    }
    progress.value = withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(delayMs, withSpring(1, SPRING)),
    );
  }, [key, delayMs, progress]);

  return useAnimatedStyle(() => ({
    opacity: Math.min(progress.value, 1),
    transform: [{ scale: START_SCALE - (START_SCALE - 1) * progress.value }],
  }));
}
