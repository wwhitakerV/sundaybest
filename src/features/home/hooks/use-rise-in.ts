import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";

const { welcome } = motion;

/**
 * A piece of the welcome rising into place once `shown`, `delayMs` on: it
 * fades in over `fadeMs` as it rises `fromY` on a short spring with a hint of
 * overshoot.
 * Shown from the start, it's simply there; hidden again, it's gone at once.
 */
export function useRiseIn(shown: boolean, delayMs = 0, fadeMs: number = welcome.fadeMs) {
  const opacity = useSharedValue(shown ? 1 : 0);
  const rise = useSharedValue(shown ? 0 : welcome.fromY);

  useEffect(() => {
    if (!shown) {
      opacity.set(0);
      rise.set(welcome.fromY);
      return;
    }
    opacity.set(withDelay(delayMs, withTiming(1, { duration: fadeMs })));
    rise.set(withDelay(delayMs, withSpring(0, welcome.rise)));
  }, [shown, delayMs, fadeMs, opacity, rise]);

  return useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: rise.get() }],
  }));
}
