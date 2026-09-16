import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

export type ScreenProps = {
  children?: ReactNode;
  /** Forwarded to the outermost view so screens stay addressable in tests. */
  testID?: string;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_EDGES: readonly Edge[] = ["top", "bottom", "left", "right"];

/** Safe-area aware page container with the themed background applied. */
export function Screen({ children, testID, edges = DEFAULT_EDGES, style }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
