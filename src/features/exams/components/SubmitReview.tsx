import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { Button } from "@/ui/atoms/Button";
import { Divider } from "@/ui/atoms/Divider";
import { useTheme } from "@/theme";

type ReviewRow = { questionId: string; number: number; answered: boolean };

export type SubmitReviewProps = {
  rows: readonly ReviewRow[];
  /** Whether Submit exam has been pressed and is waiting to be confirmed. */
  confirming: boolean;
  onOpenQuestion: (number: number) => void;
  onSubmit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Before an Exam attempt is submitted: every question, answered or not, to
 * go back to; then Submit exam, and a confirmation that names what's
 * unanswered and says it will count as incorrect.
 */
export function SubmitReview({
  rows,
  confirming,
  onOpenQuestion,
  onSubmit,
  onConfirm,
  onCancel,
}: SubmitReviewProps) {
  const theme = useTheme();
  const unanswered = rows.filter((row) => !row.answered).map((row) => row.number);

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.editorialTitle, { color: theme.colors.text }]}
      >
        Review your answers
      </Text>
      <View>
        {rows.map((row, index) => (
          <View key={row.questionId}>
            {index > 0 && <Divider />}
            <Pressable
              testID={`exam-review-row-${row.questionId}`}
              accessibilityRole="button"
              accessibilityLabel={`Question ${row.number}. ${row.answered ? "Answered" : "Unanswered"}`}
              accessibilityHint="Goes back to it"
              onPress={() => onOpenQuestion(row.number)}
              style={[styles.row, { paddingVertical: theme.spacing.md, gap: theme.spacing.md }]}
            >
              <Text style={[theme.typography.body, styles.grow, { color: theme.colors.text }]}>
                Question {row.number}
              </Text>
              <Text
                style={[
                  theme.typography.metaLabel,
                  { color: row.answered ? theme.colors.textMuted : theme.colors.text },
                ]}
              >
                {row.answered ? "Answered" : "Unanswered"}
              </Text>
              <ChevronRight
                size={18}
                color={theme.colors.textMuted}
                strokeWidth={theme.icon.strokeWidth}
              />
            </Pressable>
          </View>
        ))}
      </View>

      {confirming ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.confirm,
            {
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[theme.typography.stepTitle, { color: theme.colors.text }]}>
            Submit your exam?
          </Text>
          {unanswered.length > 0 ? (
            <>
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                {unanswered.length === 1
                  ? `Question ${unanswered.join(", ")} is unanswered.`
                  : `Questions ${unanswered.join(", ")} are unanswered.`}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                They&apos;ll count as incorrect.
              </Text>
            </>
          ) : (
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Every question is answered.
            </Text>
          )}
          <Button testID="exam-submit-confirm-button" label="Submit now" onPress={onConfirm} />
          <Button
            testID="exam-submit-cancel-button"
            label="Keep working"
            variant="secondary"
            onPress={onCancel}
          />
        </View>
      ) : (
        <Button testID="exam-submit-button" label="Submit exam" onPress={onSubmit} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  grow: { flex: 1 },
  confirm: {},
});
