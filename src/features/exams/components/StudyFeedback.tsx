import { StyleSheet, Text, View } from "react-native";
import { CircleCheck, CircleX } from "lucide-react-native";

import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";

const ICON_SIZE = 22;

export type StudyFeedbackProps = {
  correct: boolean;
  whyCorrect: string;
  /** The content's own label for the way into the teaching — "Understand why". */
  actionLabel: string;
  onUnderstandWhy: () => void;
};

/**
 * A checked Study answer's verdict, inline beneath its choices: a mark and a
 * word — green for right, ink for wrong, never red — the short reason, and
 * the way into the teaching.
 */
export function StudyFeedback({
  correct,
  whyCorrect,
  actionLabel,
  onUnderstandWhy,
}: StudyFeedbackProps) {
  const theme = useTheme();
  const ink = correct ? theme.colors.correct : theme.colors.feedbackIncorrect;
  const Icon = correct ? CircleCheck : CircleX;

  return (
    <View
      testID="exam-study-feedback"
      accessibilityLiveRegion="polite"
      style={[
        styles.panel,
        { gap: theme.spacing.sm, paddingTop: theme.spacing.md, borderColor: theme.colors.divider },
      ]}
    >
      <View style={[styles.verdict, { gap: theme.spacing.sm }]}>
        <Icon size={ICON_SIZE} color={ink} strokeWidth={theme.icon.strokeWidth} />
        <Text style={[theme.typography.stepTitle, { color: ink }]}>
          {correct ? "Correct" : "Incorrect"}
        </Text>
      </View>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>{whyCorrect}</Text>
      <Button
        testID="exam-understand-why-button"
        label={actionLabel}
        variant="secondary"
        onPress={onUnderstandWhy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 1 },
  verdict: { flexDirection: "row", alignItems: "center" },
});
