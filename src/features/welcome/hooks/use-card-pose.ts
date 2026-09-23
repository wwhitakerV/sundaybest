import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import type { CardPose } from "../logic/story";

// A long, soft ease-out: moves with intent, then settles gently.
const POSE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Glides a fan card to `pose` over `durationMs`. Returns three styles for
 * three nested views, so no transform order is relied on:
 *
 * - `tiltStyle` — rotation (about the fan's pivot) and opacity.
 * - `shiftStyle` — translation.
 * - `zoomStyle` — scale (about the card's top centre).
 *
 * `withTiming` respects the system reduce-motion setting.
 */
export function useCardPose(pose: CardPose, durationMs: number) {
  const rotate = useSharedValue(pose.rotateDeg);
  const x = useSharedValue(pose.x);
  const y = useSharedValue(pose.y);
  const scale = useSharedValue(pose.scale);
  const opacity = useSharedValue(pose.opacity);

  useEffect(() => {
    const config = { duration: durationMs, easing: POSE_EASING };
    rotate.value = withTiming(pose.rotateDeg, config);
    x.value = withTiming(pose.x, config);
    y.value = withTiming(pose.y, config);
    scale.value = withTiming(pose.scale, config);
    opacity.value = withTiming(pose.opacity, config);
  }, [
    pose.rotateDeg,
    pose.x,
    pose.y,
    pose.scale,
    pose.opacity,
    durationMs,
    rotate,
    x,
    y,
    scale,
    opacity,
  ]);

  const tiltStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  const shiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return { tiltStyle, shiftStyle, zoomStyle };
}
