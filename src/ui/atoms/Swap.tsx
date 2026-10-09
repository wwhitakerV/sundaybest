import { useEffect, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";

/** The same roll as `Collapse`, so a swap beside a roll moves with it. */
const ROLL = {
  duration: motion.rollUpMs,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
} as const;

export type SwapProps = {
  /** Which shows: the first, or the second. */
  showSecond: boolean;
  first: ReactNode;
  second: ReactNode;
  testID?: string;
};

/**
 * Two contents in one place that never moves: the one showing fades in over
 * the other as it fades out, right where it stands, and the place eases
 * between their heights on the same roll as `Collapse` — so a page's line
 * can change its words while what's below follows smoothly. Under Reduce
 * Motion it simply changes.
 */
export function Swap({ showSecond, first, second, testID }: SwapProps) {
  const progress = useSharedValue(showSecond ? 1 : 0);
  // Each content's own height, laid out apart from the box so the box can't squeeze it.
  const firstHeight = useSharedValue(0);
  const secondHeight = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(showSecond ? 1 : 0, ROLL));
  }, [showSecond, progress]);

  const box = useAnimatedStyle(() => ({
    height: firstHeight.get() + (secondHeight.get() - firstHeight.get()) * progress.get(),
  }));
  const firstStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  const secondStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return (
    <Animated.View {...(testID && { testID })} style={[styles.box, box]}>
      <Animated.View
        style={[styles.content, firstStyle]}
        pointerEvents={showSecond ? "none" : "auto"}
        accessibilityElementsHidden={showSecond}
        onLayout={(event) => firstHeight.set(event.nativeEvent.layout.height)}
      >
        {first}
      </Animated.View>
      <Animated.View
        style={[styles.content, secondStyle]}
        pointerEvents={showSecond ? "auto" : "none"}
        accessibilityElementsHidden={!showSecond}
        onLayout={(event) => secondHeight.set(event.nativeEvent.layout.height)}
      >
        {second}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The taller content is cut off with the box as it eases down.
  box: { overflow: "hidden" },
  // Both at the top of the box, its full width, as tall as each is.
  content: { position: "absolute", top: 0, left: 0, right: 0 },
});
