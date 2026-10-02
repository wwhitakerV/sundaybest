import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/theme";

/** Small enough to sit beside a line of text. */
const SIZE = 42;
/** The red line: thin… */
const ARC_STROKE = 3;
/** …and this far in from the white disc's edge. */
const ARC_INSET = 2;
const R = SIZE / 2 - ARC_INSET - ARC_STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export type ProgressDialProps = {
  /** 0–100. */
  percent: number;
  testID: string;
  /** A mark drawn in its middle — an icon sized to sit inside the ring. */
  children?: ReactNode;
};

/**
 * A small dial: a white disc (the page's own colour, so it reads on a card's
 * soft fill) with a thin accent line just inside its edge, filling clockwise
 * from the top to `percent`, and an optional mark in its centre. Still — it
 * marks where a thing stands, it doesn't announce a change. For a large ring
 * with its number inside, see `ProgressRing`.
 */
export function ProgressDial({ percent, testID, children }: ProgressDialProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.dial}
    >
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          testID={`${testID}-disc`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2}
          fill={theme.colors.background}
        />
        {percent > 0 && (
          <Circle
            testID={`${testID}-arc`}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={ARC_STROKE}
            stroke={theme.colors.accent}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dial: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  // Behind the mark, rotated so the arc starts at twelve o'clock.
  svg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
});
