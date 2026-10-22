import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

/**
 * A mock screen's content arriving: a beat after its page appears, each
 * element rises into place in turn, top to bottom (`STAGGER_MS` apart).
 */
const FADE_UP = { delayMs: 40, staggerMs: 60, durationMs: 380, offsetY: 10 } as const;

/**
 * One element of a mock screen's page arriving: it fades in as it rises into
 * place, `order` places down the page (0 = first). `shownAtOnce` (a finished
 * screen, as on a side phone) skips it. `withTiming` respects the system
 * reduce-motion setting.
 */
export function useFadeUpIn(shownAtOnce: boolean, order = 0) {
  const progress = useSharedValue(shownAtOnce ? 1 : 0);

  useEffect(() => {
    progress.value = withDelay(
      FADE_UP.delayMs + order * FADE_UP.staggerMs,
      withTiming(1, { duration: FADE_UP.durationMs, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, order]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * FADE_UP.offsetY }],
  }));
}
