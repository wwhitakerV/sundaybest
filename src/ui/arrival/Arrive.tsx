import { useContext, useEffect, useState, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";
import { ArrivalContext } from "./arrival";

const { delayMs, durationMs, staggerMs, fromY } = motion.arrival;

export type ArriveProps = {
  /** It comes down into place from just above, or rises into it from just below. */
  from: "above" | "below";
  /** Its place in the cascade, from 0: each comes a beat behind the one before. */
  order: number;
  /** Its layout: it wraps what arrives, so it takes that piece's place (`flex`, for one that fills). */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
};

/**
 * A piece of a page that arrives once a cover lifts off it (the launch intro):
 * hidden while covered, then — a beat after the cover has fully gone — fading in
 * as it drifts into place (`motion.arrival`, Daily reminder's reveal held and
 * lengthened). Away from a launch, or mounted after the page was revealed, it
 * simply shows. Reduce Motion skips the motion.
 */
export function Arrive({ from, order, style, children, testID }: ArriveProps) {
  const state = useContext(ArrivalContext);
  // Only a piece that was there, waiting, when the cover lifted comes in.
  const [awaited] = useState(() => state === "waiting");
  const shown = useSharedValue(awaited ? 0 : 1);
  const shift = from === "above" ? -fromY : fromY;

  useEffect(() => {
    if (!awaited || state !== "arriving") return;
    shown.set(
      withDelay(
        delayMs + order * staggerMs,
        withTiming(1, {
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
  }, [awaited, state, order, shown]);

  const arriving = useAnimatedStyle(() => {
    const offset = shift * (1 - shown.get());
    // Never a negative zero once in place.
    return { opacity: shown.get(), transform: [{ translateY: offset === 0 ? 0 : offset }] };
  });

  return (
    <Animated.View testID={testID} style={[style, arriving]}>
      {children}
    </Animated.View>
  );
}
