import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const START_SCALE = 1.35;
const BURST_SPRING = { damping: 14, stiffness: 160, mass: 0.8 };

/**
 * Text that bursts inward: each time `key` changes to a new non-null value
 * it snaps in from larger and transparent, springing down to size as it
 * fades in. A `null` key hides it. `delayMs` staggers a group.
 */
export function useBurstIn(key: string | null, delayMs = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (key === null) {
      progress.value = withTiming(0, { duration: 150 });
      return;
    }
    progress.value = withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(delayMs, withSpring(1, BURST_SPRING)),
    );
  }, [key, delayMs, progress]);

  return useAnimatedStyle(() => ({
    opacity: Math.min(progress.value, 1),
    transform: [{ scale: START_SCALE - (START_SCALE - 1) * progress.value }],
  }));
}
