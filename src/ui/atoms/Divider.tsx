import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";

const THICKNESS = 1;

export type DividerProps = {
  testID?: string;
  /** Room around the line, from the list it separates. */
  style?: StyleProp<ViewStyle>;
};

/** A thin rule between the rows of a list, in the theme's divider colour. */
export function Divider({ testID, style }: DividerProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.line, { backgroundColor: theme.colors.divider }, style]} />
  );
}

const styles = StyleSheet.create({
  line: { height: THICKNESS },
});
