import { StyleSheet, View } from "react-native";
import { Check, X } from "lucide-react-native";

import type { QuestionResult, QuizScore } from "@/core/store";
import type { QuizQuestion } from "@/types/domain";
import { ProgressRing } from "@/ui/atoms/ProgressRing";
import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { getScoreHeadline } from "../logic/quick-check";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

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
        <DisplayTitle style={styles.centred}>{getScoreHeadline(score)}</DisplayTitle>
        <SFProBody tone="textMuted" style={styles.centred}>
          {`${score.percentage}% right`}
        </SFProBody>
      </View>

      <Card radius={32} style={styles.list}>
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
              <SFProBody style={styles.prompt} numberOfLines={1}>
                {question.prompt}
              </SFProBody>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[32], paddingTop: space[32] },
  summary: { alignItems: "center", gap: space[12] },
  centred: { textAlign: "center" },
  list: { overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[16],
    paddingVertical: space[20],
    paddingHorizontal: space[20],
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
