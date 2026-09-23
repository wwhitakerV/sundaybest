import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { STAGE_FADE } from "../logic/story";

/** How far below its place the stage is while hidden. */
const HIDDEN_OFFSET_Y = 24;

/**
 * The whole stage coming and going: it starts hidden and a little low, fades
 * in and rises when `shown`, and fades out and sinks when not. `withTiming`
 * respects the system reduce-motion setting (it jumps straight there).
 */
export function useStageFade(shown: boolean) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = shown
      ? withTiming(1, { duration: STAGE_FADE.inMs, easing: Easing.out(Easing.cubic) })
      : withTiming(0, { duration: STAGE_FADE.outMs, easing: Easing.in(Easing.cubic) });
  }, [shown, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * HIDDEN_OFFSET_Y }],
  }));
}
