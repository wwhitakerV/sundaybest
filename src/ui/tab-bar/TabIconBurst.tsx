import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import { makeBurstStreaks, type BurstStreak } from "@/utils/burst/makeBurstStreaks";
import { useBurstStreakStyles, useTabIconBurst } from "./use-tab-icon-burst";

const STREAK_WIDTH = 2;
const STREAK_COUNT = 7;
// A 100° upward fan: wide enough to feel like a burst, narrow enough that
// the outer streaks still climb clear of the bar without flying sideways.
const SPREAD_DEG = 100;
const LONG_LENGTH = 10;
const SHORT_LENGTH = 6;
/** How far past the bar's top edge the long and short streaks finish. */
const LONG_ABOVE_BAR = 18;
const SHORT_ABOVE_BAR = 9;
// Lucide draws on a 24-unit grid and its shapes start about 2 units in from
// the top of the box, so this puts the origin on the icon's visible top edge.
const LUCIDE_TOP_INSET_RATIO = 2 / 24;

function Streak({ progress, streak }: { progress: SharedValue<number>; streak: BurstStreak }) {
  const theme = useTheme();
  const { travelStyle, lengthStyle } = useBurstStreakStyles(progress, streak);
  const box = {
    width: STREAK_WIDTH,
    height: streak.length,
    left: -STREAK_WIDTH / 2,
    top: -streak.length / 2,
  };

  return (
    // Centred on the origin; moves only by translation.
    <Animated.View style={[styles.streakBox, box, travelStyle]}>
      {/* Static tilt to the direction of travel. */}
      <View style={[styles.fill, { transform: [{ rotate: `${streak.angleDeg}deg` }] }]}>
        {/* The line itself, stretched along its own length. */}
        <Animated.View
          style={[
            styles.fill,
            styles.line,
            { backgroundColor: theme.colors.chromeIcon },
            lengthStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

export type TabIconBurstProps = {
  /** Bursts once each time this increments past 0 (`useActivationCount`). */
  activation: number;
  /** The icon's rendered size; the burst is centred on it horizontally. */
  iconSize: number;
  /** Distance from the icon's box top up to the bar's top edge, in points. */
  clearance: number;
  testID?: string;
};

/**
 * A small monochrome burst of line streaks released from the visible top
 * edge of a tab icon, at its exact horizontal centre, finishing above the
 * tab bar. Positioned with explicit coordinates inside the icon's box and
 * never takes touches.
 */
export function TabIconBurst({ activation, iconSize, clearance, testID }: TabIconBurstProps) {
  const progress = useTabIconBurst(activation);
  const originY = iconSize * LUCIDE_TOP_INSET_RATIO;
  // From the origin (slightly below the box top) up to the bar's top edge.
  const rise = clearance + originY;

  const streaks = useMemo(
    () =>
      makeBurstStreaks({
        count: STREAK_COUNT,
        spreadDeg: SPREAD_DEG,
        // + half a length so the whole streak, not just its centre, clears the bar.
        longRise: rise + LONG_ABOVE_BAR + LONG_LENGTH / 2,
        longLength: LONG_LENGTH,
        shortRise: rise + SHORT_ABOVE_BAR + SHORT_LENGTH / 2,
        shortLength: SHORT_LENGTH,
      }),
    [rise],
  );

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[styles.origin, { left: iconSize / 2, top: originY }]}
    >
      {streaks.map((streak) => (
        <Streak key={streak.angleDeg} progress={progress} streak={streak} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    position: "absolute",
    width: 0,
    height: 0,
    overflow: "visible",
  },
  streakBox: {
    position: "absolute",
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  line: {
    borderRadius: STREAK_WIDTH / 2,
  },
});
