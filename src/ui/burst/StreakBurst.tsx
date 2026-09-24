import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import type { BurstStreak } from "@/utils/burst/makeBurstStreaks";
import { useBurstStreakStyles, useStreakBurst } from "./use-streak-burst";

const STREAK_WIDTH = 2;

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

export type StreakBurstProps = {
  /** Bursts each time this changes to a new non-null value. */
  trigger: string | number | null;
  /** The fan of streaks (see `makeBurstStreaks`, `makeRadialStreaks`). */
  streaks: readonly BurstStreak[];
  /** Places the burst's origin — it's a zero-size point; position it absolutely. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A small monochrome burst of line streaks flying out from a single point —
 * on a tab icon as it's picked, or either side of a line of text as it
 * springs in. Invisible at rest, and it never takes touches.
 */
export function StreakBurst({ trigger, streaks, style, testID }: StreakBurstProps) {
  const progress = useStreakBurst(trigger);

  return (
    <View testID={testID} pointerEvents="none" style={[styles.origin, style]}>
      {streaks.map((streak) => (
        <Streak key={streak.angleDeg} progress={progress} streak={streak} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { position: "absolute", width: 0, height: 0, overflow: "visible" },
  streakBox: { position: "absolute" },
  fill: { ...StyleSheet.absoluteFill },
  line: { borderRadius: STREAK_WIDTH / 2 },
});
