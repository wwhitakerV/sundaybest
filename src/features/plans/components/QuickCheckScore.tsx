import { StyleSheet, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";

import type { QuestionResult, QuizScore } from "@/core/store";
import type { QuizQuestion } from "@/types/domain";
import { ProgressRing } from "@/ui/ProgressRing";
import { useTheme } from "@/theme";
import { getScoreHeadline } from "../logic/quick-check";

const MARK_SIZE = 32;

export type QuickCheckScoreProps = {
  score: QuizScore;
  /** Each question, with how it went — from the store. */
  results: readonly { question: QuizQuestion; result: QuestionResult }[];
};

/**
 * A finished Quick Check: the score in a ring ("2/2"), a line for how it
 * went, the percentage, and each question marked right or wrong. Also how
 * a finished attempt looks when it's opened again later.
 */
export function QuickCheckScore({ score, results }: QuickCheckScoreProps) {
  const theme = useTheme();

  return (
    <View testID="quick-check-score" style={styles.body}>
      <View style={styles.summary}>
        <ProgressRing
          testID="quick-check-score-ring"
          percent={score.percentage}
          label={`${score.correct}/${score.total}`}
        />
        <Text style={[theme.typography.display, styles.centred, { color: theme.colors.text }]}>
          {getScoreHeadline(score)}
        </Text>
        <Text style={[theme.typography.body, styles.centred, { color: theme.colors.textMuted }]}>
          {`${score.percentage}% right`}
        </Text>
      </View>

      <View
        style={[
          styles.list,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        {results.map(({ question, result }, position) => {
          const right = result === "correct";
          return (
            <View
              key={question.id}
              testID={`quick-check-result-${question.order}`}
              accessible
              accessibilityLabel={`${question.prompt} ${right ? "Right." : "Not right."}`}
              style={[
                styles.row,
                position > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.divider },
              ]}
            >
              <View
                style={[
                  styles.mark,
                  { backgroundColor: right ? theme.colors.correct : theme.colors.incorrect },
                ]}
              >
                {right ? (
                  <Check size={16} color={theme.colors.onControlPrimary} strokeWidth={3} />
                ) : (
                  <X size={16} color={theme.colors.onControlPrimary} strokeWidth={3} />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[theme.typography.body, styles.prompt, { color: theme.colors.text }]}
              >
                {question.prompt}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 32, paddingTop: 32 },
  summary: { alignItems: "center", gap: 12 },
  centred: { textAlign: "center" },
  list: { borderWidth: 1, borderRadius: 32, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  prompt: { flex: 1 },
});
