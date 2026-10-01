import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

export type TabLayout = { x: number; width: number };

const INDICATOR_SPRING = { damping: 18, stiffness: 220, mass: 0.7 };
const INDICATOR_FADE_OUT_MS = 150;

/**
 * The tab bar's active-tab pill: springs to the active tab's measured
 * `x`/`width` and fades in whenever it has somewhere to go, and fades out
 * when the focused route has no tab of its own. Shared
 * values persist, so a rapid re-tap re-targets the in-flight spring instead
 * of restarting it. `withSpring` respects the system reduce-motion setting.
 */
export function useTabIndicator(activeLayout: TabLayout | undefined) {
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    if (!activeLayout) {
      // The focused route has no tab (Settings): nothing is active, so the
      // pill fades out where it is and springs from there on the next tab.
      indicatorOpacity.value = withTiming(0, { duration: INDICATOR_FADE_OUT_MS });
      return;
    }
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
