import { StyleSheet, View } from "react-native";
import { Check, X } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { QuestionResult, QuickCheckQuestionView } from "../types";

const MARK_SIZE = 32;

export type QuickCheckResultsProps = {
  results: readonly { question: QuickCheckQuestionView; result: QuestionResult }[];
};

/** A finished Quick Check's questions, each marked right or wrong. */
export function QuickCheckResults({ results }: QuickCheckResultsProps) {
  const theme = useTheme();

  return (
    <Card testID="quick-check-score" radius={32} style={styles.list}>
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
  );
}

const styles = StyleSheet.create({
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
