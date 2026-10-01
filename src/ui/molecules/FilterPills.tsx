import { Pressable, ScrollView, StyleSheet } from "react-native";

import { radius, space, useTheme } from "@/theme";
import type { FilterOption } from "./FilterTabs";
import { SFProLabel } from "@/ui/typography/SFProLabel";

const HEIGHT = 36;

export type FilterPillsProps<Option extends FilterOption> = {
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
 * A row of filters as pills, each its label and count. The one picked fills
 * in the accent colour, its words white; the rest sit on a soft off-white,
 * their words quieter. It scrolls sideways when the pills outgrow the row.
 * For the borderless look, see `FilterTabs`.
 */
export function FilterPills<Option extends FilterOption>({
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
      contentContainerStyle={{ gap: space[8], paddingHorizontal: bleed }}
    >
      {options.map((option) => {
        const isSelected = option.label === selected;

        return (
          <Pressable
            key={option.label}
            testID={testID && `${testID}-option-${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            // Up to a 44pt target, meeting the next pill halfway across the gap.
            hitSlop={space[4]}
            onPress={() => onSelect(option.label)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? theme.colors.accent : theme.colors.pillBackground,
                borderRadius: radius.pill,
                paddingHorizontal: space[16],
                gap: space[4],
              },
            ]}
          >
            <SFProLabel variant="segment" tone={isSelected ? "onAccent" : "textInactive"}>
              {option.label}
            </SFProLabel>
            <SFProLabel variant="segment" tone={isSelected ? "onAccent" : "textMuted"}>
              {option.count}
            </SFProLabel>
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
