import { Pressable, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const HEIGHT = 44;
const ICON_SIZE = 16;

export type PillButtonProps = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  testID: string;
};

/**
 * A quiet button that opens something more — "Topics covered", "Passages"
 * — as a white 44 pt pill outlined in a hairline, its icon before its
 * label. Fills the width it's given.
 */
export function PillButton({ label, icon: Icon, onPress, testID }: PillButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.hairline,
          borderRadius: theme.radii.pill,
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
      <Text numberOfLines={1} style={[theme.typography.label, { color: theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    height: HEIGHT,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
