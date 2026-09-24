import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { SCROLL } from "../logic/scenes";

/**
 * A mock screen's content scrolling, as a finger-flick would leave it: eases
 * to each new `scrollY` (design points, 0 = top). Starts where it's told, so
 * nothing scrolls on mount — or when the story loops back to the top.
 */
export function useScrollTo(scrollY: number) {
  const offset = useSharedValue(scrollY);

  useEffect(() => {
    offset.value = withTiming(scrollY, {
      duration: SCROLL.durationMs,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [scrollY, offset]);

  return useAnimatedStyle(() => ({ transform: [{ translateY: -offset.value }] }));
}
