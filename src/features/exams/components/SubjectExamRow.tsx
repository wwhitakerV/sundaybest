import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, ChevronRight, Clock, ListChecks } from "lucide-react-native";

import { FactRow } from "@/ui/FactRow";
import { useTheme } from "@/theme";
import { formatDuration, formatPassageCount, formatQuestionCount } from "../logic/labels";
import type { Exam } from "../types";

const CHEVRON = 20;

export type SubjectExamRowProps = {
  /** "Foundations". */
  level: string;
  title: string;
  /** Its summary, where it has content that can be taken; null for one not yet written. */
  summary: Exam["summary"] | null;
  /** Where the learner stands with it — "In progress · 6 of 15 answered", "Last score · …" — if anywhere. */
  status: string | null;
  /** What waits for review on it — "Review due · 2 concepts" — if anything. */
  reviewDue: string | null;
  /** Whether it's the next to take — "Start here", "Continue" — marked in the accent. */
  next: string | null;
  onPress: () => void;
  testID: string;
};

/**
 * One exam on its subject's page: its level in the mono — and, if it's
 * the next to take, Start here or Continue beside it in the accent — its
 * title, what it asks (questions, time, passages) or that it isn't
 * available yet, and where the learner stands with it. The whole row opens
 * its overview.
 */
export function SubjectExamRow({
  level,
  title,
  summary,
  status,
  reviewDue,
  next,
  onPress,
  testID,
}: SubjectExamRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[`${level}: ${title}`, next, status, reviewDue]
        .filter(Boolean)
        .join(". ")}
      accessibilityHint="Opens the exam's overview"
      onPress={onPress}
      style={[styles.row, { gap: theme.spacing.md, paddingVertical: theme.spacing.lg }]}
    >
      <View style={[styles.words, { gap: theme.spacing.sm }]}>
        <View style={[styles.levelRow, { gap: theme.spacing.sm }]}>
          <Text style={[theme.typography.kicker, { color: theme.colors.textMuted }]}>{level}</Text>
          {next && (
            <Text
              testID={`${testID}-next`}
              style={[theme.typography.kicker, { color: theme.colors.accent }]}
            >
              {next}
            </Text>
          )}
        </View>
        <Text style={[theme.typography.stepTitle, { color: theme.colors.text }]}>{title}</Text>
        {summary ? (
          <FactRow
            testID={`${testID}-facts`}
            facts={[
              {
                key: "questions",
                icon: ListChecks,
                label: formatQuestionCount(summary.questionCount),
              },
              { key: "duration", icon: Clock, label: formatDuration(summary.durationMinutes) },
              {
                key: "passages",
                icon: BookOpen,
                label: formatPassageCount(summary.sourceLinks.length),
              },
            ]}
          />
        ) : (
          <Text style={[theme.typography.cardDetail, { color: theme.colors.textMuted }]}>
            Not available yet
          </Text>
        )}
        {status && (
          <Text style={[theme.typography.label, { color: theme.colors.text }]}>{status}</Text>
        )}
        {reviewDue && (
          <Text style={[theme.typography.label, { color: theme.colors.accent }]}>{reviewDue}</Text>
        )}
      </View>
      <ChevronRight
        size={CHEVRON}
        color={theme.colors.textMuted}
        strokeWidth={theme.icon.strokeWidth}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  words: { flex: 1 },
  levelRow: { flexDirection: "row", alignItems: "center" },
});
