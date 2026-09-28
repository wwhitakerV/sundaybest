import { StyleSheet, Text, View } from "react-native";

import type { ExamInteractionKind } from "@/types/domain";
import { LinkButton } from "@/ui/LinkButton";
import { useTheme } from "@/theme";
import { getInstruction } from "../logic/labels";
import type { PassageLink } from "../types";

export type QuestionStemProps = {
  number: number;
  total: number;
  kind: ExamInteractionKind;
  stem: string;
  passages: readonly PassageLink[];
  onOpenPassage: (url: string) => void;
};

/**
 * The top of a question: what it asks of the learner, the question itself —
 * the largest thing on the page, in the editorial face — and its passages,
 * right beneath it, to read in context.
 */
export function QuestionStem({
  number,
  total,
  kind,
  stem,
  passages,
  onOpenPassage,
}: QuestionStemProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text style={[theme.typography.metaLabel, { color: theme.colors.textMuted }]}>
        {getInstruction(kind)}
      </Text>
      <Text
        testID="exam-question-stem"
        accessibilityRole="header"
        accessibilityLabel={`Question ${number} of ${total}: ${stem}`}
        style={[theme.typography.question, { color: theme.colors.text }]}
      >
        {stem}
      </Text>
      <View style={[styles.passages, { gap: theme.spacing.md }]}>
        {passages.map((passage, index) => (
          <LinkButton
            key={passage.reference}
            testID={`exam-passage-link-${index}`}
            label={passage.reference}
            accessibilityHint="Opens the passage in Safari"
            onPress={() => onOpenPassage(passage.url)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  passages: { flexDirection: "row", flexWrap: "wrap" },
});
