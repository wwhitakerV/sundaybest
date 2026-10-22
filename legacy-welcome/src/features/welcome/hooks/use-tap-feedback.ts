import { useEffect, useRef } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const PRESSED_SCALE = 0.92;
/** A picked option pops up past this, then settles a touch larger than the rest. */
const PICKED_POP_SCALE = 1.16;
const PICKED_REST_SCALE = 1.06;
const PICK_SPRING = { damping: 13, stiffness: 240 };
const RELEASE_SPRING = { damping: 12, stiffness: 260 };
const POP_SPRING = { damping: 11, stiffness: 220 };

/**
 * A mock button being tapped: when `pressed` turns true it dips and springs
 * back, like a finger just pressed it. Rests at full size.
 */
export function usePressPulse(pressed: boolean) {
  const scale = useSharedValue(1);
  const wasPressed = useRef(pressed);

  useEffect(() => {
    if (pressed && !wasPressed.current) {
      scale.value = withSequence(
        withTiming(PRESSED_SCALE, { duration: 90 }),
        withSpring(1, RELEASE_SPRING),
      );
    }
    wasPressed.current = pressed;
  }, [pressed, scale]);

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

/**
 * Something appearing with a pop — a check mark, a selection. Springs from
 * nothing to full size when `visible` turns true; already-visible on mount
 * stays put, so a finished scene doesn't replay.
 */
export function usePopIn(visible: boolean) {
  const scale = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    scale.value = visible ? withSpring(1, POP_SPRING) : withTiming(0, { duration: 0 });
  }, [visible, scale]);

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

/**
 * Fades toward `opacity` whenever it changes — a glow warming up, a line of
 * text coming in, an option dimming. Starts at the given opacity, so a
 * finished scene doesn't replay on mount.
 */
export function useFadeTo(opacity: number, durationMs = 300) {
  const value = useSharedValue(opacity);

  useEffect(() => {
    value.value = withTiming(opacity, { duration: durationMs });
  }, [opacity, durationMs, value]);

  return useAnimatedStyle(() => ({ opacity: value.value }));
}

/**
 * A picked option — a day chip — as one piece: when `picked` turns true the
 * whole thing (border and all) pops up and settles a little larger than its
 * neighbours; unpicked, it springs back to size. Already picked on mount
 * stays put, so a finished scene doesn't replay.
 */
export function usePickPop(picked: boolean) {
  const scale = useSharedValue(picked ? PICKED_REST_SCALE : 1);
  const wasPicked = useRef(picked);

  useEffect(() => {
    if (picked && !wasPicked.current) {
      scale.value = withSequence(
        withTiming(PICKED_POP_SCALE, { duration: 120 }),
        withSpring(PICKED_REST_SCALE, PICK_SPRING),
      );
    } else if (!picked && wasPicked.current) {
      scale.value = withSpring(1, PICK_SPRING);
    }
    wasPicked.current = picked;
  }, [picked, scale]);

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}
