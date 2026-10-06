import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { radius, useTheme } from "@/theme";

/** The line's thickness: a hairline you can still read at a glance. */
const TRACK_HEIGHT = 4;
const PROGRESS_EASE_MS = 600;

export type ProgressLineProps = { percent: number; testID: string };

/**
 * How far a build is along, in the accent, on a faint track — set on the
 * primary control's colour (the generation bar, the sheet's header). Eases to
 * each new value; under Reduce Motion it jumps.
 */
export function ProgressLine({ percent, testID }: ProgressLineProps) {
  const theme = useTheme();
  const shown = useSharedValue(percent);

  useEffect(() => {
    shown.set(
      withTiming(percent, { duration: PROGRESS_EASE_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [percent, shown]);

  const fill = useAnimatedStyle(() => ({ width: `${shown.value}%` }));

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.onControlPrimaryFaint }]}>
      <Animated.View
        testID={testID}
        style={[styles.fill, { backgroundColor: theme.colors.accent }, fill]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: TRACK_HEIGHT, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: TRACK_HEIGHT, borderRadius: radius.pill },
});
