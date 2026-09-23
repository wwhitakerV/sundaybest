import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const REVEAL_DELAY_MS = 350;
// Under-damped on purpose: rises ~6–7pt past rest, then settles — the bounce.
const REVEAL_SPRING = { damping: 10, stiffness: 180, mass: 0.8 };
const HIDE_DURATION_MS = 120;
const HIDDEN_TRANSLATE_Y = 28;

/**
 * The tab bar's reveal: it starts in its hidden position (transparent, 28pt
 * low) and, each time it becomes `visible`, waits 350ms, then springs up and
 * fades in, bouncing a little past its resting place before it settles.
 * When `visible` goes false (a modal or another non-tab screen covers it) it
 * drops back to the hidden position quickly, so the next reveal plays from
 * the start again.
 *
 * `withSpring`/`withTiming` respect the system reduce-motion setting.
 */
export function useTabBarReveal(visible: boolean) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible
      ? withDelay(REVEAL_DELAY_MS, withSpring(1, REVEAL_SPRING))
      : withTiming(0, { duration: HIDE_DURATION_MS });
  }, [visible, progress]);

  return useAnimatedStyle(() => ({
    opacity: Math.min(progress.value, 1),
    transform: [{ translateY: (1 - progress.value) * HIDDEN_TRANSLATE_Y }],
  }));
}
