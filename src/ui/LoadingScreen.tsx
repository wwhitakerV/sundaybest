import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Screen } from "./Screen";
import { useTheme } from "@/theme";

const SPINNER_SIZE = 16;
const SPINNER_BORDER_WIDTH = 2;
const SPIN_DURATION_MS = 900;
const SPINNER_BOTTOM_OFFSET = 56;

/**
 * Shown while the app's fonts are still loading (see `AppProviders`), in
 * place of a blank screen. The masthead falls back to the system font for
 * this brief render — the real masthead face (`src/theme/fonts.ts`) is
 * exactly what is not loaded yet.
 *
 * `withRepeat`/`withTiming` default `reduceMotion` to `ReduceMotion.System`,
 * so a viewer with reduce-motion enabled gets the spinner's final frame
 * instead of a spin, with no extra wiring here.
 */
export function LoadingScreen() {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: SPIN_DURATION_MS, easing: Easing.linear }),
      -1,
    );
  }, [rotation]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Screen testID="loading-screen" style={styles.content}>
      <Text style={[theme.typography.masthead, { color: theme.colors.text }]}>SUNDAYBEST</Text>
      <Animated.View
        testID="loading-spinner"
        style={[
          styles.spinner,
          { borderColor: theme.colors.divider, borderTopColor: theme.colors.controlPrimary },
          spinnerStyle,
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", justifyContent: "center" },
  spinner: {
    position: "absolute",
    bottom: SPINNER_BOTTOM_OFFSET,
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: SPINNER_BORDER_WIDTH,
  },
});
