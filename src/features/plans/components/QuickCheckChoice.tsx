import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";

import type { QuizChoice } from "@/types/domain";
import { useTheme } from "@/theme";
import { describeChoice, type ChoiceLook } from "../logic/quick-check";

const RADIUS = 28;
const LETTER_SIZE = 36;
/** The picked outline's weight — drawn over the 1pt border, never in layout. */
const PICKED_OUTLINE = 2;
/** Once an answer is checked, the choices it wasn't step back. */
const FADED_OPACITY = 0.45;

export type QuickCheckChoiceProps = {
  choice: QuizChoice;
  look: ChoiceLook;
  /** Whether this was the user's answer — for what a screen reader says. */
  picked: boolean;
  /** Absent once the question's checked: an answer is given once. */
  onPress?: () => void;
  testID: string;
};

/**
 * One multiple-choice answer: its letter in a ring, then its words. Picked,
 * it's outlined and its letter fills; checked, the right answer turns green
 * with a check, a wrong pick red with a cross, and the rest step back.
 */
export function QuickCheckChoice({ choice, look, picked, onPress, testID }: QuickCheckChoiceProps) {
  const theme = useTheme();
  const surface =
    look === "correct"
      ? { backgroundColor: theme.colors.correctSurface, borderColor: theme.colors.correctBorder }
      : look === "incorrect"
        ? {
            backgroundColor: theme.colors.incorrectSurface,
            borderColor: theme.colors.incorrectBorder,
          }
        : look === "selected"
          ? { backgroundColor: theme.colors.background, borderColor: theme.colors.divider }
          : { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider };
  const disc =
    look === "correct"
      ? theme.colors.correct
      : look === "incorrect"
        ? theme.colors.incorrect
        : look === "selected"
          ? theme.colors.controlPrimary
          : "transparent";

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={describeChoice(choice, look, picked)}
      accessibilityState={{ selected: look === "selected", disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.choice, surface, look === "faded" && styles.faded]}
    >
      {look === "selected" && (
        <View pointerEvents="none" style={[styles.outline, { borderColor: theme.colors.text }]} />
      )}
      <View
        style={[
          styles.letter,
          {
            borderColor: disc === "transparent" ? theme.colors.divider : disc,
            backgroundColor: disc,
          },
        ]}
      >
        {look === "correct" ? (
          <Check size={18} color={theme.colors.onControlPrimary} strokeWidth={3} />
        ) : look === "incorrect" ? (
          <X size={18} color={theme.colors.onControlPrimary} strokeWidth={3} />
        ) : (
          <Text
            style={[
              theme.typography.label,
              {
                color: look === "selected" ? theme.colors.onControlPrimary : theme.colors.textMuted,
              },
            ]}
          >
            {choice.label}
          </Text>
        )}
      </View>
      <Text style={[theme.typography.body, styles.text, { color: theme.colors.text }]}>
        {choice.text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    borderWidth: 1,
    borderRadius: RADIUS,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  outline: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: PICKED_OUTLINE,
    borderRadius: RADIUS + 1,
  },
  letter: {
    width: LETTER_SIZE,
    height: LETTER_SIZE,
    borderRadius: LETTER_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  faded: { opacity: FADED_OPACITY },
});
