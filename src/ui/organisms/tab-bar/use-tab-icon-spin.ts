import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Timed against the active pill's spring (`use-tab-indicator.ts`): the coin
// finishes just after the pill arrives, so the spin reads as the last beat.
const SPIN_DURATION_MS = 540;
// Fast off the mark, long soft landing, no overshoot: crisp rather than wobbly.
const SPIN_EASING = Easing.bezier(0.3, 0, 0.1, 1);
// Depth for the 3D turn. Lower is more dramatic; this keeps the edge-on
// moment readable at a 23pt icon without distorting it.
const PERSPECTIVE = 320;

/**
 * One full coin-spin (360° about the vertical axis) per activation (see
 * `useActivationCount`) — i.e. while the active pill slides over to the tab.
 * Activation 0 is mount, which doesn't spin. A new activation mid-spin
 * restarts from 0 cleanly. `withTiming` respects the system reduce-motion
 * setting (it jumps to the end, and 360° looks the same as rest).
 */
export function useTabIconSpin(activation: number) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (activation === 0) return;
    rotation.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(360, { duration: SPIN_DURATION_MS, easing: SPIN_EASING }),
    );
  }, [activation, rotation]);

  return useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotation.value}deg` }],
  }));
}
