import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

/** Soft, lightly under-damped: the pill overshoots its length a touch, then settles. */
const SPRING = { damping: 16, stiffness: 200, mass: 0.8 };

/**
 * One pagination dot's width, springing between its resting size and its
 * active length: it stretches out into the pill as it becomes the active
 * one, and springs back as it stops being. Starts where it is on mount, with
 * no animation. The spring follows the system Reduce Motion setting.
 */
export function usePaginationDot(active: boolean, width: number, activeWidth: number) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.set(withSpring(active ? 1 : 0, SPRING));
  }, [active, progress]);

  return useAnimatedStyle(() => ({
    width: width + (activeWidth - width) * progress.value,
  }));
}
