import { Easing, withDelay, withTiming } from "react-native-reanimated";

import { motion } from "@/theme";

/**
 * The day panel's entrance (`motion.panelEnter`): fading in as it rises into
 * place, easing out, after `delayMs`. Under Reduce Motion, the fade alone.
 */
export function panelEnter(reduceMotion: boolean, delayMs = 0) {
  const { durationMs, fromY } = motion.panelEnter;
  return () => {
    "worklet";
    const timing = { duration: durationMs, easing: Easing.out(Easing.cubic) };
    return {
      initialValues: { opacity: 0, transform: [{ translateY: reduceMotion ? 0 : fromY }] },
      animations: {
        opacity: withDelay(delayMs, withTiming(1, timing)),
        transform: [{ translateY: withDelay(delayMs, withTiming(0, timing)) }],
      },
    };
  };
}
