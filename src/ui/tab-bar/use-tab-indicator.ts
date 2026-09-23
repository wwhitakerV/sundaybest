import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

export type TabLayout = { x: number; width: number };

const INDICATOR_SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

/**
 * The tab bar's active-tab pill: springs to the active tab's measured
 * `x`/`width` and fades in the first time it has somewhere to go. Shared
 * values persist, so a rapid re-tap re-targets the in-flight spring instead
 * of restarting it. `withSpring` respects the system reduce-motion setting.
 */
export function useTabIndicator(activeLayout: TabLayout | undefined) {
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    if (!activeLayout) return;
    indicatorX.value = withSpring(activeLayout.x, INDICATOR_SPRING);
    indicatorWidth.value = withSpring(activeLayout.width, INDICATOR_SPRING);
    indicatorOpacity.value = withSpring(1, INDICATOR_SPRING);
  }, [activeLayout, indicatorX, indicatorWidth, indicatorOpacity]);

  return useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));
}
