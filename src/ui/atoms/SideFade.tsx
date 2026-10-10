import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { edgeFade, useTheme } from "@/theme";

export type SideFadeProps = {
  /** How wide the fade is, in from its container's edge. */
  width: number;
  /** Which edge: the row's end (the default), or its start. */
  side?: "start" | "end";
  testID?: string;
};

/**
 * The page's colour fading in toward a row's edge — the top and bottom fades
 * turned on their side, at the edges' peak — so a row that runs on past it
 * reads as going on. Absolutely positioned at that edge; never takes touches.
 */
export function SideFade({ width, side = "end", testID }: SideFadeProps) {
  const theme = useTheme();
  // Unique per instance: SVG gradient ids are document-global on some renderers.
  const gradientId = `side-fade-${useId()}`;

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[styles.fade, side === "end" ? styles.end : styles.start, { width }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          {/* Clear on the inside, the page's colour at the edge. */}
          <LinearGradient
            id={gradientId}
            x1={side === "end" ? "0" : "1"}
            y1="0"
            x2={side === "end" ? "1" : "0"}
            y2="0"
          >
            <Stop offset="0" stopColor={theme.colors.background} stopOpacity={0} />
            <Stop offset="1" stopColor={theme.colors.background} stopOpacity={edgeFade.peak} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: "absolute", top: 0, bottom: 0 },
  end: { right: 0 },
  start: { left: 0 },
});
