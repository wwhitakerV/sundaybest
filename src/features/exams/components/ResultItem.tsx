import { StyleSheet, Text, View } from "react-native";
import { CircleCheck, CircleX } from "lucide-react-native";

import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";

export type ResultItemProps = {
  number: number;
  stem: string;
  correct: boolean;
  /** The user's answer in words; null for none. */
  yourAnswer: string | null;
  correctAnswer: string;
  whyCorrect: string;
  actionLabel: string;
  onUnderstandWhy: () => void;
  testID: string;
};

/** One question on the results: the user's answer, the right one, the verdict in words, why, and the way to the teaching. */
export function ResultItem({
  number,
  stem,
  correct,
  yourAnswer,
  correctAnswer,
  whyCorrect,
  actionLabel,
  onUnderstandWhy,
  testID,
}: ResultItemProps) {
  const theme = useTheme();
  const ink = correct ? theme.colors.correct : theme.colors.feedbackIncorrect;
  const Icon = correct ? CircleCheck : CircleX;
  const quiet = [theme.typography.cardDetail, { color: theme.colors.textInactive }];

  return (
    <View testID={testID} style={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.md }}>
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        <Text style={[theme.typography.metaLabel, styles.grow, { color: theme.colors.textMuted }]}>
          Question {number}
        </Text>
        <Icon size={18} color={ink} strokeWidth={theme.icon.strokeWidth} />
        <Text style={[theme.typography.metaLabel, { color: ink }]}>
          {correct ? "Correct" : "Incorrect"}
        </Text>
      </View>
      <Text style={[theme.typography.stepTitle, { color: theme.colors.text }]}>{stem}</Text>
      <Text style={quiet}>{yourAnswer ? `Your answer: ${yourAnswer}` : "No answer"}</Text>
      <Text style={quiet}>{`Correct answer: ${correctAnswer}`}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>{whyCorrect}</Text>
      <Button
        testID={`${testID}-understand-why-button`}
        label={actionLabel}
        variant="secondary"
        onPress={onUnderstandWhy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
});
