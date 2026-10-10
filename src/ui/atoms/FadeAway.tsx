import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { ReduceMotion, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { motion } from "@/theme";

export type FadeAwayProps = {
  /** Faded out, or back in: over `motion.exitMs` either way. */
  hidden: boolean;
  children: ReactNode;
  /** Its place: positioning only. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Something drawn over the page that steps aside when asked — fading out
 * rather than vanishing, and back in the same way (a fade a page's colour
 * makes unwelcome). Never takes touches.
 */
export function FadeAway({ hidden, children, style, testID }: FadeAwayProps) {
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(hidden ? 0 : 1, {
      duration: motion.exitMs,
      reduceMotion: ReduceMotion.Never,
    }),
  }));

  return (
    <Animated.View testID={testID} pointerEvents="none" style={[style, fade]}>
      {children}
    </Animated.View>
  );
}
