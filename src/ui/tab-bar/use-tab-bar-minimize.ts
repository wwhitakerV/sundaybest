import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { bounceWithin } from "@/utils/motion/bounceWithin";

/** Lightly under-damped: the button beside the gathered tabs bounces sideways into place. */
const BUTTON_SPRING = { damping: 12, stiffness: 170, mass: 0.9 };
/**
 * The same stiffness, a little under critical damping (2√(stiffness × mass)
 * ≈ 24.7): it overshoots its end by about 5% — which `bounceWithin` turns
 * into a small bounce back off that end.
 */
const CAPSULE_SPRING = { damping: 17, stiffness: 170, mass: 0.9 };
/** How far to the left the button starts, springing in beside the gathered tabs. */
const BUTTON_TRAVEL = 44;

function clamp(value: number): number {
  "worklet";
  return Math.min(1, Math.max(0, value));
}

/**
 * The tab bar gathering into its active tab beside a screen's button, and
 * opening back out — springs, fired whenever `minimized` or `buttonShown`
 * changes (not tied to a gesture). The button can stay shown with the tabs
 * open (`useTabBarRaise` moves it). `fullWidth` is the capsule's width open;
 * `circle` its width gathered. The springs follow the system Reduce Motion
 * setting.
 */
export function useTabBarMinimize(
  minimized: boolean,
  buttonShown: boolean,
  fullWidth: number,
  circle: number,
) {
  const capsule = useSharedValue(minimized ? 1 : 0);
  const button = useSharedValue(buttonShown ? 1 : 0);

  useEffect(() => {
    capsule.set(withSpring(minimized ? 1 : 0, CAPSULE_SPRING));
  }, [minimized, capsule]);
  useEffect(() => {
    button.set(withSpring(buttonShown ? 1 : 0, BUTTON_SPRING));
  }, [buttonShown, button]);

  const capsuleStyle = useAnimatedStyle(() =>
    fullWidth > 0
      ? // Sized outright once measured — not flexed — so it can gather.
        { flex: 0, width: fullWidth - (fullWidth - circle) * bounceWithin(capsule.value) }
      : {},
  );
  // The tabs give way quickly; the active one appears alone as it gathers.
  const tabsStyle = useAnimatedStyle(() => ({
    opacity: 1 - clamp(bounceWithin(capsule.value) * 2),
  }));
  const gatheredStyle = useAnimatedStyle(() => ({
    opacity: clamp((bounceWithin(capsule.value) - 0.3) / 0.7),
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: clamp(button.value * 1.5),
    transform: [{ translateX: (1 - button.value) * -BUTTON_TRAVEL }],
  }));

  return { capsuleStyle, tabsStyle, gatheredStyle, buttonStyle };
}
