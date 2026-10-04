import { ActivityIndicator, StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";

export type ContentPendingProps = {
  testID: string;
  compact?: boolean;
};

/**
 * A restrained, in-place loading state for a screen's content region.
 * It never owns the screen and never replaces navigation or chrome.
 */
export function ContentPending({ testID, compact = false }: ContentPendingProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[styles.root, compact && styles.compact]}
    >
      <ActivityIndicator color={theme.colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space[24],
  },
  compact: {
    minHeight: 96,
    paddingVertical: space[16],
  },
});
