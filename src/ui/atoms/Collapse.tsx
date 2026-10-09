import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";

const ROLL = {
  duration: motion.rollUpMs,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
} as const;

export type CollapseProps = {
  /** Shown, or rolled up out of the way. */
  open: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * A part of a page a switch puts away and brings back: it rolls up —
 * its height to nothing, fading — and what's below moves up into its room,
 * frame by frame on the UI thread; it rolls down again the same way. Under
 * Reduce Motion it simply goes and comes.
 */
export function Collapse({ open, children, testID }: CollapseProps) {
  // Its own height, laid out in full — what it rolls between — read where the roll is drawn.
  const height = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);

  // It clips only while it rolls (and while rolled up): open and still, what floats from it
  // past its edges — the chart's book label — shows whole.
  const [rolling, setRolling] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setRolling(true);
  }

  useEffect(() => {
    progress.set(
      withTiming(open ? 1 : 0, ROLL, (finished) => {
        if (finished) runOnJS(setRolling)(false);
      }),
    );
  }, [open, progress]);

  // The box is only ever as tall as the roll makes it — its content laid out apart from it, so
  // the box can't squeeze it, and measured at its true height whatever the box is doing.
  const style = useAnimatedStyle(() => ({
    height: height.get() * progress.get(),
    opacity: progress.get(),
  }));

  return (
    <Animated.View
      {...(testID && { testID })}
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      style={[(rolling || !open) && styles.clip, style]}
    >
      <View
        style={styles.content}
        onLayout={(event) => height.set(event.nativeEvent.layout.height)}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // What's rolling, or rolled up, is cut off with it.
  clip: { overflow: "hidden" },
  // At the top of the box, its full width, as tall as it is — never squeezed by the box's height.
  content: { position: "absolute", top: 0, left: 0, right: 0 },
});
