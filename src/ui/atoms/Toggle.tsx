import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { controlHeight, motion, radius, useTheme } from "@/theme";

/** iOS's own switch size, so it sits in a row as one does. */
const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_INSET = 2;
const THUMB_SIZE = TRACK_HEIGHT - THUMB_INSET * 2;
/** How far the knob travels from off to on. */
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;
/** Grows the press area to a full tap target around the track. */
const SLOP = {
  top: (controlHeight.hitTarget - TRACK_HEIGHT) / 2,
  bottom: (controlHeight.hitTarget - TRACK_HEIGHT) / 2,
  left: 0,
  right: 0,
};

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID: string;
};

/**
 * On or off, drawn flat in the theme's own colours — not iOS's glass switch.
 * On is the accent, as every chosen thing in the app is, under a white knob.
 * The knob springs across and the accent fills the track as it goes, landing without a
 * bounce (`motion.snap`); with motion reduced it simply moves.
 */
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  testID,
}: ToggleProps) {
  const theme = useTheme();
  const progress = useSharedValue(value ? 1 : 0);
  const { accent, divider, onAccent, toggleThumbOff, shadow } = theme.colors;

  // Follows the value it's given, wherever the change came from.
  useEffect(() => {
    progress.set(withSpring(value ? 1 : 0, { ...motion.snap, reduceMotion: ReduceMotion.System }));
  }, [value, progress]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [toggleThumbOff, onAccent]),
    transform: [{ translateX: TRAVEL * progress.get() }],
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={SLOP}
      onPress={() => onValueChange(!value)}
    >
      <Animated.View
        testID={`${testID}-track`}
        style={[styles.track, { borderRadius: radius.pill, backgroundColor: divider }]}
      >
        {/* The on colour, filling in over the quiet track as the knob crosses. */}
        <Animated.View
          testID={`${testID}-fill`}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.pill, backgroundColor: accent },
            fillStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.thumb,
            { borderRadius: radius.pill, shadowColor: shadow, ...theme.elevation.thumb },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: TRACK_WIDTH, height: TRACK_HEIGHT, padding: THUMB_INSET },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE },
});
