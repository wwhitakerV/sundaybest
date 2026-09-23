import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useTheme } from "@/theme";

/** By default the last fifth is solid, so nothing ever shows at the very edge. */
const DEFAULT_SOLID_RATIO = 0.2;

export type BottomFadeProps = {
  /** How tall the fade is, measured up from its container's bottom edge. */
  height: number;
  /**
   * How much of that, at the bottom, is fully opaque. The ramp runs above it,
   * so content is completely gone before the container's edge and a clipping
   * edge can never show through.
   */
  solidHeight?: number;
  testID?: string;
};

/**
 * Dissolves whatever sits beneath it into the page background toward the
 * bottom of its container — for content that deliberately runs out of view.
 * Absolutely positioned; place it after the content inside a positioned
 * parent. Never takes touches.
 */
export function BottomFade({
  height,
  solidHeight = height * DEFAULT_SOLID_RATIO,
  testID,
}: BottomFadeProps) {
  const theme = useTheme();
  // Unique per instance: SVG gradient ids are document-global on some renderers.
  const gradientId = `bottom-fade-${useId()}`;
  const solidFrom = height > 0 ? Math.min(1, Math.max(0, 1 - solidHeight / height)) : 1;

  return (
    <View testID={testID} pointerEvents="none" style={[styles.fade, { height }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.background} stopOpacity={0} />
            <Stop offset={solidFrom} stopColor={theme.colors.background} stopOpacity={1} />
            <Stop offset="1" stopColor={theme.colors.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
