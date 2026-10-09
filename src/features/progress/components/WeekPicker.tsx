import { Fragment } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { Popover, type PopoverAnchor } from "@/ui/organisms/Popover";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { WeekOption } from "../logic/week-picker";

/** The popover's width: room for a sermon's title, its "+2 more", and the check. */
const WIDTH = 304;
const CHECK = 18;

export type WeekPickerProps = {
  visible: boolean;
  onClose: () => void;
  anchor: PopoverAnchor;
  options: readonly WeekOption[];
  /** The week showing, by its Sunday. */
  selected: string;
  onPick: (weekStart: string) => void;
};

/**
 * A few weeks in the app's popover — up to four past this one — the page
 * dimmed a little behind it: this week first, then each week a plan ran in by
 * how long ago, its newest sermon under it and how many more, the week
 * showing checked. Past four, the dates open the full-screen weeks instead.
 */
export function WeekPicker({
  visible,
  onClose,
  anchor,
  options,
  selected,
  onPick,
}: WeekPickerProps) {
  const theme = useTheme();
  const pick = (weekStart: string) => {
    onClose();
    onPick(weekStart);
  };

  return (
    <Popover
      testID="progress-week-picker"
      accessibilityLabel="Weeks"
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      width={WIDTH}
      dim
    >
      {options.map((option, index) => (
        <Fragment key={option.weekStart}>
          {index > 0 && <Divider />}
          <Pressable
            testID={`progress-week-option-${option.weekStart}`}
            accessibilityRole="button"
            accessibilityState={{ selected: option.weekStart === selected }}
            accessibilityLabel={[
              option.label,
              option.title,
              option.more > 0 ? `and ${option.more} more` : null,
            ]
              .filter(Boolean)
              .join(", ")}
            onPress={() => pick(option.weekStart)}
            style={({ pressed }) => [
              styles.row,
              { gap: space[12], paddingHorizontal: space[16], paddingVertical: space[12] },
              pressed && { backgroundColor: theme.colors.segmentBackground },
            ]}
          >
            <View style={[styles.copy, { gap: space[2] }]}>
              <SFProBody numberOfLines={1}>{option.label}</SFProBody>
              {option.title && (
                // The title gives way first, so "+2 more" always shows whole.
                <View style={[styles.row, { gap: space[4] }]}>
                  <SFProBody
                    variant="rowDetail"
                    tone="textSupporting"
                    numberOfLines={1}
                    style={styles.title}
                  >
                    {option.title}
                  </SFProBody>
                  {option.more > 0 && (
                    <SFProBody variant="rowDetail" tone="textMuted">
                      {`+${option.more} more`}
                    </SFProBody>
                  )}
                </View>
              )}
            </View>
            {option.weekStart === selected && (
              <Check size={CHECK} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
            )}
          </Pressable>
        </Fragment>
      ))}
    </Popover>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  copy: { flex: 1 },
  title: { flexShrink: 1 },
});
