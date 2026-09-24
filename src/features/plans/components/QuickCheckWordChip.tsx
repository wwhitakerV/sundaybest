import { Pressable, StyleSheet, Text } from "react-native";

import type { QuizChoice } from "@/types/domain";
import { useTheme } from "@/theme";
import { describeChoice, type ChoiceLook } from "../logic/quick-check";

/** A word picked into the verse steps back in the row, as it's gone up into the blank. */
const USED_OPACITY = 0.4;

export type QuickCheckWordChipProps = {
  choice: QuizChoice;
  look: ChoiceLook;
  picked: boolean;
  /** Absent once the question's checked. */
  onPress?: () => void;
  testID: string;
};

/**
 * One finish-the-verse choice: the words, in a pill. Picked, it steps back
 * (its words are in the verse now); checked, the right one is edged green
 * and a wrong pick red.
 */
export function QuickCheckWordChip({
  choice,
  look,
  picked,
  onPress,
  testID,
}: QuickCheckWordChipProps) {
  const theme = useTheme();
  const edge =
    look === "correct"
      ? theme.colors.correctBorder
      : look === "incorrect"
        ? theme.colors.incorrectBorder
        : theme.colors.divider;
  const fill =
    look === "correct"
      ? theme.colors.correctSurface
      : look === "incorrect"
        ? theme.colors.incorrectSurface
        : theme.colors.background;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={describeChoice(choice, look, picked)}
      accessibilityState={{ selected: look === "selected", disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: edge, backgroundColor: fill, borderRadius: theme.radii.pill },
        (look === "selected" || look === "faded") && styles.used,
      ]}
    >
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>{choice.text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, paddingHorizontal: 22, paddingVertical: 12 },
  used: { opacity: USED_OPACITY },
});
