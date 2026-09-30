import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useTheme } from "@/theme";
import type { FilterTabOption } from "@/ui/FilterTabs";

const HEIGHT = 36;

export type FilterPillsProps<Option extends FilterTabOption> = {
  options: readonly Option[];
  selected: Option["label"];
  onSelect: (label: Option["label"]) => void;
  /**
   * How far the row reaches past its container on each side — the page's
   * inset — so it scrolls to the screen's edges while its first pill still
   * lines up with the page.
   */
  bleed?: number;
  testID?: string;
};

/**
 * A row of filters as pills, each its label and count — Plans' "All / In
 * progress / Done / Saved". The one picked fills in the brand red, its words
 * white; the rest sit on a soft off-white, their words quieter. It scrolls
 * sideways when the pills outgrow the row.
 */
export function FilterPills<Option extends FilterTabOption>({
  options,
  selected,
  onSelect,
  bleed = 0,
  testID,
}: FilterPillsProps<Option>) {
  const theme = useTheme();

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.row, { marginHorizontal: -bleed }]}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: bleed }}
    >
      {options.map((option) => {
        const isSelected = option.label === selected;
        const labelColor = isSelected ? theme.colors.onAccent : theme.colors.textInactive;
        const countColor = isSelected ? theme.colors.onAccent : theme.colors.textMuted;

        return (
          <Pressable
            key={option.label}
            testID={testID && `${testID}-option-${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            // Up to a 44pt target, meeting the next pill halfway across the gap.
            hitSlop={theme.spacing.xs}
            onPress={() => onSelect(option.label)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? theme.colors.accent : theme.colors.pillBackground,
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.md,
                gap: theme.spacing.xs,
              },
            ]}
          >
            <Text style={[theme.typography.segmentLabel, { color: labelColor }]}>
              {option.label}
            </Text>
            <Text style={[theme.typography.segmentLabel, { color: countColor }]}>
              {option.count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A horizontal ScrollView grows, and shrinks, with the column it's in by
  // default; this row keeps to its pills' height — never squeezed by a list
  // below it, which cut the pills off at their foot.
  row: { flexGrow: 0, flexShrink: 0 },
  pill: { height: HEIGHT, flexDirection: "row", alignItems: "center" },
});
