import { Pressable, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const HEIGHT = 40;
const ICON_SIZE = 16;

export type ChipProps = {
  label: string;
  /** An icon before the label. */
  icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/**
 * One choice in a row of them — a category, a filter — as a pill with an
 * icon and a label. Unselected, it's outlined in a hairline and its words are
 * quieter; selected, it fills with the segmented control's active grey and
 * its words come up to full ink. Quiet either way, so a row of them doesn't
 * shout.
 */
export function Chip({ label, icon: Icon, selected, onPress, testID }: ChipProps) {
  const theme = useTheme();
  const ink = selected ? theme.colors.text : theme.colors.textInactive;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      // Up to a 44pt target, meeting the next chip's halfway across the gap.
      hitSlop={theme.spacing.xs}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.segmentActiveBackground : "transparent",
          borderColor: selected ? "transparent" : theme.colors.hairline,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      {Icon && <Icon size={ICON_SIZE} color={ink} strokeWidth={theme.icon.strokeWidth} />}
      <Text style={[theme.typography.segmentLabel, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
});
