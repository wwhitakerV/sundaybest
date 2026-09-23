import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

export type ScreenProps = {
  children?: ReactNode;
  /** Forwarded to the outermost view so screens stay addressable in tests. */
  testID?: string;
  edges?: readonly Edge[];
  /**
   * Applies the standard page inset (24 horizontal, 12 top) and the 16pt gap
   * between sections that nearly every screen uses. `style` still applies on
   * top, for screens that need something extra.
   */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_EDGES: readonly Edge[] = ["top", "bottom", "left", "right"];

/** Safe-area aware page container with the themed background applied. */
export function Screen({
  children,
  testID,
  edges = DEFAULT_EDGES,
  padded = false,
  style,
}: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  padded: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
