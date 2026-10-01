import { Pressable, StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";

const GAP = space[20];
const COUNT_GAP = 1;

/** One filter in a filter row: what it's called, and how many it holds. */
export type FilterOption = {
  label: string;
  count: number;
};

export type FilterTabsProps<Option extends FilterOption> = {
  options: readonly Option[];
  selected: Option["label"];
  onSelect: (label: Option["label"]) => void;
  testID?: string;
};

/**
 * A borderless row of filters, each its label with a superscript count. No
 * track, no per-option background: just spaced text, the one picked in the
 * stronger ink. For the filled-pill look, see `FilterPills`.
 */
export function FilterTabs<Option extends FilterOption>({
  options,
  selected,
  onSelect,
  testID,
}: FilterTabsProps<Option>) {
  return (
    <View testID={testID} style={styles.row}>
      {options.map((option) => {
        const isSelected = option.label === selected;

        return (
          <Pressable
            key={option.label}
            testID={testID && `${testID}-option-${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.label)}
            style={styles.option}
          >
            <SFProLabel variant="filter" tone={isSelected ? "chromeIcon" : "textMuted"}>
              {option.label}
            </SFProLabel>
            <SFProLabel
              variant="filterCount"
              tone={isSelected ? "chromeIcon" : "textMuted"}
              style={styles.count}
            >
              {option.count}
            </SFProLabel>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: GAP },
  option: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "transparent" },
  count: { marginLeft: COUNT_GAP },
});
