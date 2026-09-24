import { StyleSheet, Text, View } from "react-native";
import { CircleCheck, CircleX } from "lucide-react-native";

import type { QuizQuestion } from "@/types/domain";
import { Button } from "@/ui/Button";
import { PAGE_INSET } from "@/ui/Screen";
import { useTheme } from "@/theme";
import type { QuickCheckAction } from "../logic/quick-check";

export type QuickCheckFeedbackProps = {
  /** How the question went — from the store, never worked out here. */
  result: "correct" | "incorrect";
  question: QuizQuestion;
  action: QuickCheckAction;
  onAction: () => void;
};

/**
 * The verdict once a question's checked, rising from the bottom of the
 * screen in its colour: "That's the one" or "Not quite", why (the passage,
 * then the explanation), and the way on.
 */
export function QuickCheckFeedback({
  result,
  question,
  action,
  onAction,
}: QuickCheckFeedbackProps) {
  const theme = useTheme();
  const right = result === "correct";
  const ink = right ? theme.colors.correct : theme.colors.incorrect;
  const Icon = right ? CircleCheck : CircleX;
  const why = [question.scriptureReference, question.explanation].filter(Boolean).join(". ");

  return (
    <View
      testID="quick-check-feedback"
      style={[
        styles.panel,
        {
          backgroundColor: right ? theme.colors.correctSurface : theme.colors.incorrectSurface,
          borderColor: right ? theme.colors.correctBorder : theme.colors.incorrectBorder,
        },
      ]}
    >
      <View style={styles.verdict}>
        <Icon size={22} color={ink} strokeWidth={theme.icon.strokeWidth} />
        <Text style={[theme.typography.headline, { color: ink }]}>
          {right ? "That's the one" : "Not quite"}
        </Text>
      </View>
      {why ? <Text style={[theme.typography.body, { color: ink }]}>{why}</Text> : null}
      <Button testID={action.testID} label={action.label} onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Runs to the screen's edges, past the page inset, with rounded top corners.
  panel: {
    marginHorizontal: -PAGE_INSET,
    paddingHorizontal: PAGE_INSET,
    paddingTop: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  verdict: { flexDirection: "row", alignItems: "center", gap: 10 },
});
