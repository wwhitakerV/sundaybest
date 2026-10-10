import { useEffect } from "react";
import { Keyboard, useWindowDimensions } from "react-native";
import { Easing, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";

/**
 * iOS's keyboard curve, near enough: what rides the keyboard moves as the
 * keys do, never a beat behind or a jump ahead.
 */
const KEYBOARD_CURVE = Easing.bezier(0.38, 0.7, 0.125, 1);

/**
 * How far the keyboard covers the screen from its foot — 0 while it's away —
 * as a value that moves with the keyboard on the UI thread, over the
 * keyboard's own duration and curve: for something that rides it (a bar on
 * the keys). It works wherever it's used, a modal sheet included.
 */
export function useKeyboardLift(): SharedValue<number> {
  const { height } = useWindowDimensions();
  const lift = useSharedValue(Math.max(height - (Keyboard.metrics()?.screenY ?? height), 0));

  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardWillChangeFrame",
      ({ duration, endCoordinates }) => {
        const next = Math.max(height - endCoordinates.screenY, 0);
        lift.set(duration > 0 ? withTiming(next, { duration, easing: KEYBOARD_CURVE }) : next);
      },
    );
    return () => subscription.remove();
  }, [height, lift]);

  return lift;
}
