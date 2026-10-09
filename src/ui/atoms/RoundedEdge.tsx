import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/theme";

export type RoundedEdgeProps = {
  /** The corners' radius: the cards' own, so they round into it along their own curve. */
  radius: number;
  /** How far in from each side the corners sit: where the cards' sides are. */
  inset: number;
  testID?: string;
};

/**
 * Two inward corners in the page's colour, for a list's pinned bar's foot
 * (placed there by its caller): what scrolls up under the bar meets a rounded edge, not a
 * straight cut, and a card flows into it with its corners round to the last.
 * Never touched.
 */
export function RoundedEdge({ radius, inset, testID }: RoundedEdgeProps) {
  const theme = useTheme();
  const fill = theme.colors.background;
  // The square's outer corner, less the quarter circle round the window's corner.
  const left = `M0 0 H${radius} A${radius} ${radius} 0 0 0 0 ${radius} Z`;
  const right = `M0 0 H${radius} V${radius} A${radius} ${radius} 0 0 0 0 0 Z`;

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[styles.edge, { height: radius, paddingHorizontal: inset }]}
    >
      <Svg width={radius} height={radius}>
        <Path d={left} fill={fill} />
      </Svg>
      <Svg width={radius} height={radius}>
        <Path d={right} fill={fill} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { flexDirection: "row", justifyContent: "space-between" },
});
