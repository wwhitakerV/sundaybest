import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { LIFT } from "../logic/scenes";
import type { LiftLayout } from "../logic/lift";

// Jumping off: quick, with a little overshoot, like it springs free.
const LIFT_SPRING = { damping: 17, stiffness: 190, mass: 0.9 };
// Snapping back: firm and exact, so it lands precisely on its copy.
const RETURN_EASING = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * Moves a lifted piece between its spot on the phone (progress 0) and the
 * foreground (progress 1). Starts at 0, springs to 1 when `lifted` turns
 * true, and eases back to 0 when it turns false.
 *
 * Three styles, one kind of motion each, for nested views — so no transform
 * order is relied on:
 * - `moveStyle` — translation, and the piece's opacity (it may start
 *   half-faded, matching the phone's copy where it sits in the fade).
 * - `sizeStyle` — scale about the top left. It rests at the lifted scale,
 *   which is 1:1 wherever the screen allows, so text is sharp at rest.
 * - `cardStyle` — the floating card behind the piece: absent on the phone,
 *   fading and growing in as it rises.
 */
export function useLiftMotion(lifted: boolean, layout: LiftLayout) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = lifted
      ? withSpring(1, LIFT_SPRING)
      : withTiming(0, { duration: LIFT.backMs, easing: RETURN_EASING });
  }, [lifted, progress]);

  const { onPhone, lifted: up, onPhoneOpacity } = layout;

  const moveStyle = useAnimatedStyle(() => {
    const clamped = Math.min(Math.max(progress.value, 0), 1);
    return {
      opacity: onPhoneOpacity + (1 - onPhoneOpacity) * clamped,
      transform: [
        { translateX: onPhone.x + (up.x - onPhone.x) * progress.value },
        { translateY: onPhone.y + (up.y - onPhone.y) * progress.value },
      ],
    };
  });
  const sizeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: onPhone.scale + (up.scale - onPhone.scale) * progress.value }],
  }));
  const cardStyle = useAnimatedStyle(() => {
    const clamped = Math.min(Math.max(progress.value, 0), 1);
    return { opacity: clamped, transform: [{ scale: 0.94 + 0.06 * clamped }] };
  });

  return { moveStyle, sizeStyle, cardStyle };
}
