import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

const GAP = 20;
const COUNT_GAP = 1;

export type FilterTabOption = {
  label: string;
  count: number;
};

export type FilterTabsProps<Option extends FilterTabOption> = {
  options: readonly Option[];
  selected: Option["label"];
  onSelect: (label: Option["label"]) => void;
  testID?: string;
};

/**
 * A borderless row of labelled counts — Plans' "All / In progress / Done /
 * Saved" row. No track, no per-segment background: just spaced text with a
 * superscript count.
 */
export function FilterTabs<Option extends FilterTabOption>({
  options,
  selected,
  onSelect,
  testID,
}: FilterTabsProps<Option>) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      {options.map((option) => {
        const isSelected = option.label === selected;
        const color = isSelected ? theme.colors.chromeIcon : theme.colors.textMuted;

        return (
          <Pressable
            key={option.label}
            testID={testID && `${testID}-option-${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.label)}
            style={styles.option}
          >
            <Text style={[theme.typography.filterLabel, { color }]}>{option.label}</Text>
            <Text style={[theme.typography.filterCount, styles.count, { color }]}>
              {option.count}
            </Text>
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
