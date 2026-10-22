import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme";

/** A hairline, just heavy enough to read as progress. */
const THICKNESS = 2;

export type ProgressLineProps = {
  /** How long it takes to fill, from mount. */
  durationMs: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A thin line that fills left to right, at an even pace, over `durationMs` —
 * once, from mount. Give it a new `key` to run it again. It fills by
 * stretching a solid bar from its left edge, so nothing is laid out per frame.
 */
export function ProgressLine({ durationMs, testID, style }: ProgressLineProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.linear });
  }, [durationMs, progress]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return (
    <View testID={testID} style={[styles.track, { backgroundColor: theme.colors.divider }, style]}>
      <Animated.View
        testID={testID && `${testID}-fill`}
        style={[styles.fill, { backgroundColor: theme.colors.accent }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: THICKNESS, overflow: "hidden" },
  fill: { ...StyleSheet.absoluteFill, transformOrigin: "0% 50%" },
});
