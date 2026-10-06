import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";

import { radius as corners, useTheme } from "@/theme";

export type BoneProps = {
  /** Its width: points, or a share of its row ("60%"). Fills the row by default. */
  width?: DimensionValue;
  height: number;
  /** Its corner: a line of text's gentle round by default; `corners.pill` for a circle or a pill. */
  radius?: number;
  /** Layout extras: a margin, a self-alignment. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** One still block of a skeleton, standing in for a line of text, a picture, or a card. */
export function Bone({ width = "100%", height, radius = corners[10], style, testID }: BoneProps) {
  const theme = useTheme();
  return (
    <View
      testID={testID}
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.colors.skeleton },
        style,
      ]}
    />
  );
}
