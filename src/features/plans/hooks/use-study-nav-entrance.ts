import { useEffect, useRef, useState } from "react";
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { sparkBuzz } from "@/core/haptics/haptics";

const ENTRANCE_START_TRANSLATE_Y = 32;
const ENTRANCE_START_SCALE = 0.97;

const ENTRANCE_DELAY_MS = 80;
const ENTRANCE_FADE_DURATION_MS = 160;

const ENTRANCE_OVERSHOOT_Y = -6;
const ENTRANCE_OVERSHOOT_SCALE = 1.015;
const ENTRANCE_RISE_DURATION_MS = 220;

const SPARK_FIRE_DELAY_MS = 280;
const SPARK_VISIBLE_MS = 850;

/**
 * StudyNav's one-time entrance, run on mount: a short delay, then a fade in
 * while it rises past its resting place and springs back, scaling the same
 * way. The spark burst and the haptic buzz fire together partway through,
 * and the sparks clear themselves afterwards. Every timer and animation is
 * cancelled on unmount.
 */
export function useStudyNavEntrance() {
  const [showSparks, setShowSparks] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(ENTRANCE_START_TRANSLATE_Y);
  const scale = useSharedValue(ENTRANCE_START_SCALE);

  const entranceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    entranceTimeoutRef.current = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: ENTRANCE_FADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });

      translateY.value = withSequence(
        withTiming(ENTRANCE_OVERSHOOT_Y, {
          duration: ENTRANCE_RISE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withSpring(0, {
          damping: 11,
          stiffness: 210,
          mass: 0.55,
        }),
      );

      scale.value = withSequence(
        withTiming(ENTRANCE_OVERSHOOT_SCALE, {
          duration: ENTRANCE_RISE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withSpring(1, {
          damping: 12,
          stiffness: 220,
          mass: 0.5,
        }),
      );
    }, ENTRANCE_DELAY_MS);

    sparkTimeoutRef.current = setTimeout(() => {
      setShowSparks(true);
      sparkBuzz();

      sparkCleanupTimeoutRef.current = setTimeout(() => {
        setShowSparks(false);
      }, SPARK_VISIBLE_MS);
    }, SPARK_FIRE_DELAY_MS);

    return () => {
      if (entranceTimeoutRef.current) {
        clearTimeout(entranceTimeoutRef.current);
      }

      if (sparkTimeoutRef.current) {
        clearTimeout(sparkTimeoutRef.current);
      }

      if (sparkCleanupTimeoutRef.current) {
        clearTimeout(sparkCleanupTimeoutRef.current);
      }

      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [opacity, scale, translateY]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return { entranceStyle, showSparks };
}
