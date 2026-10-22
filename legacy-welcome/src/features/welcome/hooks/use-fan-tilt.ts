import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { FAN, getFanDelayMs } from "../logic/story";

/** Fanning out: a lively swing that settles with a touch of overshoot. */
const OUT_SPRING = { duration: FAN.outMs, dampingRatio: 0.72 } as const;
/**
 * Folding in: one continuous swing, easing off the mark and gathering speed
 * — the part that shows — then slowing out of sight behind the big phone.
 * A spring would show only its hesitant start here, and hide its settle.
 */
const FOLD = { duration: FAN.inMs, easing: Easing.inOut(Easing.cubic) } as const;

/**
 * Side card `index`'s tilt about the fan's pivot: from upright (tucked behind
 * the big phone) out to `angleDeg` on a spring when `fanned`, each card on its
 * turn (`getFanDelayMs`); and back home when not, every card together.
 * Starts upright, so the hand opens on mount. Animations and delays respect
 * the system reduce-motion setting.
 */
export function useFanTilt(index: number, angleDeg: number, fanned: boolean) {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withDelay(
      getFanDelayMs(index, fanned),
      fanned ? withSpring(angleDeg, OUT_SPRING) : withTiming(0, FOLD),
    );
  }, [index, angleDeg, fanned, angle]);

  return useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
}
