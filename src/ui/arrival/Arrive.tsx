import { useContext, useEffect, useState, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  measure,
  ReduceMotion,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";
import { ArrivalContext, ArrivalLineContext, COVERED } from "./arrival";

const { delayMs, durationMs, staggerMs, fromY, followPt } = motion.arrival;

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
 * How far in a piece is, 0–1, once a cover lifting from the top down has
 * uncovered the page to `line`: none until the cover's edge reaches its top,
 * all of it `followPt` further on — fast, then settling, as the cascade eases.
 */
function behindTheEdge(line: number, top: number): number {
  "worklet";
  const p = Math.min(1, Math.max(0, (line - top) / followPt));
  return 1 - (1 - p) ** 3;
}

/**
 * A piece of a page that arrives once a cover lifts off it (the launch intro):
 * hidden while covered, then — a beat after the cover has fully gone — fading in
 * as it drifts into place (`motion.arrival`, Daily reminder's reveal held and
 * lengthened). Under a cover that lifts from the top down (`ArrivalLineContext`)
 * it comes in as the cover's edge passes it instead. Away from a launch, or
 * mounted after the page was revealed, it simply shows. Reduce Motion skips the
 * motion.
 */
export function Arrive({ from, order, style, children, testID }: ArriveProps) {
  const state = useContext(ArrivalContext);
  const line = useContext(ArrivalLineContext);
  // Only a piece that was there, waiting, when the cover lifted comes in.
  const [awaited] = useState(() => state === "waiting");
  const shown = useSharedValue(awaited ? 0 : 1);
  const ref = useAnimatedRef<Animated.View>();
  const shift = from === "above" ? -fromY : fromY;
  const followsEdge = awaited && line !== null;

  useEffect(() => {
    if (!awaited || followsEdge || state !== "arriving") return;
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
  }, [awaited, followsEdge, state, order, shown]);

  const arriving = useAnimatedStyle(() => {
    let progress = shown.get();
    if (followsEdge) {
      const y = line.get();
      // Where it sits on the screen is only asked once the cover has started to lift.
      const box = y > COVERED ? measure(ref) : null;
      progress = y > COVERED ? behindTheEdge(y, box ? box.pageY : 0) : 0;
    }
    const offset = shift * (1 - progress);
    // Never a negative zero once in place.
    return { opacity: progress, transform: [{ translateY: offset === 0 ? 0 : offset }] };
  });

  return (
    <Animated.View ref={ref} testID={testID} style={[style, arriving]}>
      {children}
    </Animated.View>
  );
}
