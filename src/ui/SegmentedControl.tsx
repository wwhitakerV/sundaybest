import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

const OUTER_PADDING = 5;
const OUTER_RADIUS = 29;
const GAP = 2;
const SEGMENT_H_PADDING = 14;
const SEGMENT_V_PADDING = 10;
const SEGMENT_RADIUS = 25;

export type SegmentedControlProps<Option extends string> = {
  options: readonly Option[];
  selected: Option;
  onSelect: (option: Option) => void;
  testID?: string;
};

/**
 * A pill-group control: a bordered, tinted track holding evenly-spaced
 * segments, the selected one raised on its own tinted background. Distinct
 * from `FilterTabs`, which has no track or per-segment background at all.
 */
export function SegmentedControl<Option extends string>({
  options,
  selected,
  onSelect,
  testID,
}: SegmentedControlProps<Option>) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.track,
        { backgroundColor: theme.colors.segmentBackground, borderColor: theme.colors.hairline },
      ]}
    >
      {options.map((option) => {
        const isSelected = option === selected;

        return (
          <Pressable
            key={option}
            testID={testID && `${testID}-option-${option}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option)}
            style={[
              styles.segment,
              {
                backgroundColor: isSelected ? theme.colors.segmentActiveBackground : "transparent",
              },
            ]}
          >
            <Text
              style={[
                theme.typography.segmentLabel,
                { color: isSelected ? theme.colors.chromeIcon : theme.colors.chromeTitle },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: OUTER_PADDING,
    borderRadius: OUTER_RADIUS,
    borderWidth: 1,
    gap: GAP,
  },
  segment: {
    paddingHorizontal: SEGMENT_H_PADDING,
    paddingVertical: SEGMENT_V_PADDING,
    borderRadius: SEGMENT_RADIUS,
  },
});
