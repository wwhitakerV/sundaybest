import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme";

const DEFAULT_SIZE = 16;
const BORDER_WIDTH = 2;
const SPIN_DURATION_MS = 900;

export type SpinnerProps = {
  /** Its diameter. */
  size?: number;
  testID: string;
};

/**
 * The app's one spinner: an unfilled ring on the progress track, with an
 * accent arc turning around it. Shown where something is under way — the
 * launch fallback, and the step a plan is being built at.
 *
 * `withRepeat`/`withTiming` default `reduceMotion` to `ReduceMotion.System`,
 * so a viewer with reduce-motion enabled sees the ring still, with no extra
 * wiring here.
 */
export function Spinner({ size = DEFAULT_SIZE, testID }: SpinnerProps) {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.set(
      withRepeat(withTiming(360, { duration: SPIN_DURATION_MS, easing: Easing.linear }), -1),
    );
  }, [rotation]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: BORDER_WIDTH,
          borderColor: theme.colors.progressTrack,
          borderTopColor: theme.colors.accent,
          backgroundColor: "transparent",
        },
        spin,
      ]}
    />
  );
}
