import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/theme";

const SIZE = 160;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
  /** 0–100. */
  percent: number;
  /** What's written inside: the percentage by default, or e.g. a score ("2/2"). */
  label?: string;
  testID: string;
};

/**
 * A ring that fills clockwise from the top to `percent`, easing to each new
 * value, with the number — or `label` — inside. Plan creation's progress, and
 * a Quick Check's score.
 */
export function ProgressRing({ percent, label, testID }: ProgressRingProps) {
  const theme = useTheme();
  const progress = useSharedValue(percent / 100);

  useEffect(() => {
    progress.value = withTiming(percent / 100, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [percent, progress]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.ring}
    >
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.segmentBackground}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          fill="none"
          animatedProps={arcProps}
        />
      </Svg>
      <Text style={[theme.typography.display, { color: theme.colors.text }]}>
        {label ?? `${percent}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  // Rotated so the arc starts at twelve o'clock.
  svg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
});
