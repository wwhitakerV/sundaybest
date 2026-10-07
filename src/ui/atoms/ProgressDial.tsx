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
/** A bare ring's line: firm enough to see at its small size. */
const BARE_STROKE = 3.5;

export type ProgressDialProps = {
  /** 0–100. */
  percent: number;
  testID: string;
  /** A mark drawn in its middle — an icon sized to sit inside the ring. */
  children?: ReactNode;
  /**
   * Bare, for a dark surface: no disc — a white line on a faint white
   * track, small and sleek (a plan card's panel).
   */
  bare?: boolean;
  /** Its width and height; 42 unless asked. */
  size?: number;
};

/**
 * A small dial: a white disc (the page's own colour, so it reads on a card's
 * soft fill) with a thin accent line just inside its edge, filling clockwise
 * from the top to `percent`, and an optional mark in its centre. Still — it
 * marks where a thing stands, it doesn't announce a change. For a large ring
 * with its number inside, see `ProgressRing`. `bare`, for a dark surface:
 * just a white line on a faint white track.
 */
export function ProgressDial({
  percent,
  testID,
  children,
  bare = false,
  size = SIZE,
}: ProgressDialProps) {
  const theme = useTheme();
  const stroke = bare ? BARE_STROKE : ARC_STROKE;
  const r = size / 2 - (bare ? 0 : ARC_INSET) - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const centre = size / 2;

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.dial, { width: size, height: size }]}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {bare ? (
          <Circle
            testID={`${testID}-track`}
            cx={centre}
            cy={centre}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={theme.colors.inkOnDarkFaint}
          />
        ) : (
          <Circle
            testID={`${testID}-disc`}
            cx={centre}
            cy={centre}
            r={centre}
            fill={theme.colors.background}
          />
        )}
        {percent > 0 && (
          <Circle
            testID={`${testID}-arc`}
            cx={centre}
            cy={centre}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={bare ? theme.colors.inkOnDark : theme.colors.accent}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dial: { alignItems: "center", justifyContent: "center" },
  // Behind the mark, rotated so the arc starts at twelve o'clock.
  svg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
});
