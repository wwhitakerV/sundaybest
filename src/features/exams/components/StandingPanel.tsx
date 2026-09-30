import { StyleSheet, Text, View } from "react-native";

import { RotateCcw } from "lucide-react-native";

import { PillButton } from "@/ui/PillButton";
import { useTheme } from "@/theme";

const ACTIVE_DOT = 7;

export type StandingPanelProps = {
  /** "In progress · 6 of 15 answered", "Last score · 12 of 15 · Strong". */
  status: string;
  /** Whether it's under way: marked as active. */
  active: boolean;
  /** The concepts behind missed answers, by title — the way back to study. */
  review: readonly string[];
  /** A short study of just what was missed — "Review 2 concepts" — when there's one to begin. */
  reviewAction?: { label: string; onPress: () => void; testID: string } | null;
  testID: string;
};

/**
 * Where the learner stands with an exam, near its top: how far through, or
 * the last score — and, after one, the concepts behind the answers missed,
 * to go back to, and a short study of just those to review them. The
 * passages and explanations are a tap away.
 */
export function StandingPanel({
  status,
  active,
  review,
  reviewAction = null,
  testID,
}: StandingPanelProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.panel,
        {
          borderColor: theme.colors.hairline,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        },
      ]}
    >
      <View style={[styles.status, { gap: theme.spacing.sm }]}>
        {active && (
          <View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.accent, borderRadius: theme.radii.pill },
            ]}
          />
        )}
        <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>{status}</Text>
      </View>

      {review.length > 0 && (
        <View style={{ gap: theme.spacing.sm }}>
          <Text
            accessibilityRole="header"
            style={[theme.typography.kicker, { color: theme.colors.textMuted }]}
          >
            For review
          </Text>
          <View style={[styles.chips, { gap: theme.spacing.sm }]}>
            {review.map((title) => (
              <View
                key={title}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.surface, borderRadius: theme.radii.pill },
                ]}
              >
                <Text style={[theme.typography.tag, { color: theme.colors.text }]}>{title}</Text>
              </View>
            ))}
          </View>
          <Text style={[theme.typography.cardDetail, { color: theme.colors.textInactive }]}>
            Each has its passages and an explanation in your results.
          </Text>
          {reviewAction && (
            <View style={styles.action}>
              <PillButton
                testID={reviewAction.testID}
                icon={RotateCcw}
                label={reviewAction.label}
                onPress={reviewAction.onPress}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { flexDirection: "row" },
  panel: { borderWidth: 1 },
  status: { flexDirection: "row", alignItems: "center" },
  dot: { width: ACTIVE_DOT, height: ACTIVE_DOT },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 6 },
});
