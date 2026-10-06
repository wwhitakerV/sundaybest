import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useTheme } from "@/theme";
import { clampUnit } from "@/utils/motion/clampUnit";

export type TopFadeProps = {
  /** How tall the fade is, measured down from its container's top edge. */
  height: number;
  /** How much of that, at the top, is fully opaque. The ramp runs below it. */
  solidHeight: number;
  /**
   * The ramp's opacities down its height (`at` 0–1), for a softer fall-off;
   * a straight solid-to-clear ramp without it.
   */
  ramp?: readonly { at: number; opacity: number }[];
  testID?: string;
};

/**
 * `BottomFade` turned over: solid at the top of its container — behind the
 * status bar and a floating header — dissolving into the page below, so what
 * scrolls up under a header fades rather than stopping at its edge.
 * Absolutely positioned; never takes touches.
 */
export function TopFade({ height, solidHeight, ramp = LINEAR_RAMP, testID }: TopFadeProps) {
  const theme = useTheme();
  // Unique per instance: SVG gradient ids are document-global on some renderers.
  const gradientId = `top-fade-${useId()}`;
  const solidTo = height > 0 ? clampUnit(solidHeight / height) : 1;

  return (
    <View testID={testID} pointerEvents="none" style={[styles.fade, { height }]}>
      {/* A number, not "100%": the SVG keeps its first size when its box later grows. */}
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {[
              { offset: 0, opacity: 1 },
              ...ramp.map(({ at, opacity }) => ({ offset: solidTo + at * (1 - solidTo), opacity })),
            ].map(({ offset, opacity }, index) => (
              <Stop
                // The stops are fixed for a fade; their order is their identity.
                key={index}
                offset={offset}
                stopColor={theme.colors.background}
                stopOpacity={opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const LINEAR_RAMP = [
  { at: 0, opacity: 1 },
  { at: 1, opacity: 0 },
] as const;

const styles = StyleSheet.create({
  fade: { position: "absolute", top: 0, left: 0, right: 0 },
});
