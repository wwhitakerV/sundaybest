import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useLaunchReady } from "@/core/providers/launch-ready";
import { motion, useTheme } from "@/theme";

/**
 * The launch with Reduce Motion on: none of the intro, only the colour the app
 * opened on, fading away to the page once it's ready (shown under it, all of
 * it, as the fade begins: `onStart`).
 */
export function ReducedMotionLaunch({
  revealed,
  onStart,
  onDone,
}: {
  revealed: SharedValue<number>;
  onStart: () => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const ready = useLaunchReady();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!ready) return;
    // The page appears under the white as it starts to fade.
    revealed.set(1);
    onStart();
    // A fade is what Reduce Motion asks for, so it plays even with the setting on.
    opacity.set(
      withTiming(
        0,
        { duration: motion.handoffMs, reduceMotion: ReduceMotion.Never },
        (finished) => {
          if (finished) runOnJS(onDone)();
        },
      ),
    );
  }, [ready, opacity, onStart, onDone, revealed]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      testID="launch-intro-fade"
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }, fade]}
    />
  );
}
