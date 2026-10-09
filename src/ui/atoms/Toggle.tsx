import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";
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
/** With an icon in it, a little wider: room for the icon beside the knob at either end. */
const ICON_ROOM = 6;
/** How far the knob travels from off to on, along a track this wide. */
const travelOn = (width: number) => width - THUMB_SIZE - THUMB_INSET * 2;
/** An icon set in the switch (`icon`): small enough to sit in the knob with room around it. */
const ICON = 15;
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
  /**
   * What it switches, drawn in it: on, in the knob in the accent; off, in the
   * black in the empty end of the track the knob will cross to.
   */
  icon?: LucideIcon;
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
  icon: Icon,
  testID,
}: ToggleProps) {
  const theme = useTheme();
  const width = Icon ? TRACK_WIDTH + ICON_ROOM : TRACK_WIDTH;
  const travel = travelOn(width);
  const progress = useSharedValue(value ? 1 : 0);
  const { accent, divider, onAccent, toggleThumbOff, shadow } = theme.colors;

  // Follows the value it's given, wherever the change came from.
  useEffect(() => {
    progress.set(withSpring(value ? 1 : 0, { ...motion.snap, reduceMotion: ReduceMotion.System }));
  }, [value, progress]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const offIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [toggleThumbOff, onAccent]),
    transform: [{ translateX: travel * progress.get() }],
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
        style={[styles.track, { width, borderRadius: radius.pill, backgroundColor: divider }]}
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
        {Icon && (
          // Off: in the end the knob will cross to, in black; it gives way as the knob comes.
          <Animated.View style={[styles.offIcon, { left: THUMB_INSET + travel }, offIconStyle]}>
            <Icon
              size={ICON}
              color={theme.colors.text}
              strokeWidth={theme.icon.strokeWidthStrong}
            />
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.thumb,
            { borderRadius: radius.pill, shadowColor: shadow, ...theme.elevation.thumb },
            thumbStyle,
          ]}
        >
          {Icon && (
            // On: in the knob, in the accent, showing as the track fills.
            <Animated.View style={fillStyle}>
              <Icon size={ICON} color={accent} strokeWidth={theme.icon.strokeWidthStrong} />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { height: TRACK_HEIGHT, padding: THUMB_INSET },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, alignItems: "center", justifyContent: "center" },
  // Where the knob comes to rest when on.
  offIcon: {
    position: "absolute",
    top: THUMB_INSET,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
