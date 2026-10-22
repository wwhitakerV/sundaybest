import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";

import { bounceWithin } from "@/utils/motion/bounceWithin";
import { clampUnit } from "@/utils/motion/clampUnit";

/** Lightly under-damped: the button beside the gathered tabs bounces sideways into place. */
const BUTTON_SPRING = { damping: 12, stiffness: 170, mass: 0.9 };

/**
 * The button's spring: the bounce coming in. Leaving, it stops dead at
 * hidden — left to bounce, it would swing past hidden and back, flashing the
 * button into view again as it went.
 */
export function buttonSpring(shown: boolean): WithSpringConfig {
  return shown ? BUTTON_SPRING : { ...BUTTON_SPRING, overshootClamping: true };
}
/**
 * The same stiffness, a little under critical damping (2√(stiffness × mass)
 * ≈ 24.7): it overshoots its end by about 5% — which `bounceWithin` turns
 * into a small bounce back off that end.
 */
const CAPSULE_SPRING = { damping: 17, stiffness: 170, mass: 0.9 };
/** How far to the left the button starts, springing in beside the gathered tabs. */
const BUTTON_TRAVEL = 44;

/**
 * The tab bar gathering into its active tab beside a screen's button, and
 * opening back out — springs, fired whenever `minimized` or `buttonShown`
 * changes (not tied to a gesture). The button can stay shown with the tabs
 * open (`useTabBarRaise` moves it). `fullWidth` is the capsule's width open;
 * `circle` its width gathered. `fabRoom` is the floating button's room
 * beside it — `room` wide — and how much of it the button has left (`taken`,
 * 0–1): the capsule widens into it as the button goes. The springs follow the
 * system Reduce Motion setting.
 */
export function useTabBarMinimize(
  minimized: boolean,
  buttonShown: boolean,
  fullWidth: number,
  circle: number,
  fabRoom?: { room: number; taken: SharedValue<number> },
) {
  const capsule = useSharedValue(minimized ? 1 : 0);
  const button = useSharedValue(buttonShown ? 1 : 0);

  useEffect(() => {
    capsule.set(withSpring(minimized ? 1 : 0, CAPSULE_SPRING));
  }, [minimized, capsule]);
  useEffect(() => {
    button.set(withSpring(buttonShown ? 1 : 0, buttonSpring(buttonShown)));
  }, [buttonShown, button]);

  const capsuleStyle = useAnimatedStyle(() => {
    // The floating button's room the capsule has taken, as the button goes.
    const taken = fabRoom ? fabRoom.room * fabRoom.taken.value : 0;
    const room = fabRoom ? { marginRight: fabRoom.room - taken } : {};
    const open = fullWidth + taken;
    return fullWidth > 0
      ? // Sized outright once measured — not flexed — so it can gather.
        { flex: 0, width: open - (open - circle) * bounceWithin(capsule.value), ...room }
      : room;
  });
  // The tabs give way quickly; the active one appears alone as it gathers.
  const tabsStyle = useAnimatedStyle(() => ({
    opacity: 1 - clampUnit(bounceWithin(capsule.value) * 2),
  }));
  const gatheredStyle = useAnimatedStyle(() => ({
    opacity: clampUnit((bounceWithin(capsule.value) - 0.3) / 0.7),
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: clampUnit(button.value * 1.5),
    transform: [{ translateX: (1 - button.value) * -BUTTON_TRAVEL }],
  }));

  return { capsuleStyle, tabsStyle, gatheredStyle, buttonStyle };
}
