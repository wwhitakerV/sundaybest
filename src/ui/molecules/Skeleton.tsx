import { useEffect, type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";

export type SkeletonProps = {
  /** Its bones (`Bone`), laid out as the content they stand for will be. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID: string;
};

/**
 * Content on its way, shown as its own shape: still blocks where its words
 * and pictures will be, breathing together, gently, as iOS's do. Never a
 * spinner. Under Reduce Motion it holds still (`withRepeat`/`withTiming`
 * follow the system setting).
 */
export function Skeleton({ children, style, testID }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.set(
      withRepeat(
        withTiming(motion.skeletonDim, {
          duration: motion.skeletonPulseMs,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      style={[style, pulse]}
    >
      {children}
    </Animated.View>
  );
}
