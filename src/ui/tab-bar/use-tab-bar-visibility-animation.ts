import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const VISIBILITY_DROP_DISTANCE = 24;
// "Super fast and springy": high stiffness snaps it out of view almost
// immediately, and the lower damping gives it a touch of overshoot on the way
// back in rather than a dead stop.
const VISIBILITY_SPRING = { damping: 14, stiffness: 400, mass: 0.6 };

/** Fades the tab bar out and drops it a short distance when hidden, and back. */
export function useTabBarVisibilityAnimation(visible: boolean) {
  const visibility = useSharedValue(1);

  useEffect(() => {
    visibility.value = withSpring(visible ? 1 : 0, VISIBILITY_SPRING);
  }, [visible, visibility]);

  return useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [{ translateY: (1 - visibility.value) * VISIBILITY_DROP_DISTANCE }],
  }));
}
