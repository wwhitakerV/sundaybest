import { useContext, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaInsetsContext, type Edge } from "react-native-safe-area-context";

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

/**
 * Safe-area aware page container with the themed background applied.
 *
 * Insets come from the app-level `SafeAreaProvider` (window insets, fixed),
 * not a native `SafeAreaView`. The native view measures its own position,
 * so inside a native modal it reads a top inset of 0 while sliding up, then
 * jumps to the notch height when it lands — the content visibly snaps.
 * Outside a provider (unit tests), insets are 0.
 */
export function Screen({
  children,
  testID,
  edges = DEFAULT_EDGES,
  padded = false,
  style,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useContext(SafeAreaInsetsContext);

  const safeAreaPadding = {
    paddingTop: edges.includes("top") ? (insets?.top ?? 0) : 0,
    paddingBottom: edges.includes("bottom") ? (insets?.bottom ?? 0) : 0,
    paddingLeft: edges.includes("left") ? (insets?.left ?? 0) : 0,
    paddingRight: edges.includes("right") ? (insets?.right ?? 0) : 0,
  };

  return (
    <View
      testID={testID}
      style={[styles.root, { backgroundColor: theme.colors.background }, safeAreaPadding]}
    >
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  padded: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
