import { StyleSheet, Text, View } from "react-native";

import type { Id, QuizQuestion } from "@/types/domain";
import { useTheme } from "@/theme";
import { getChoiceLook, getQuestionKicker, splitVersePrompt } from "../logic/quick-check";
import { QuickCheckChoice } from "./QuickCheckChoice";
import { QuickCheckWordChip } from "./QuickCheckWordChip";

export type QuickCheckQuestionProps = {
  question: QuizQuestion;
  /** The choice picked and not yet checked, if any. */
  selectedChoiceId: Id | null;
  /** The choice it was answered with, once checked. */
  answeredChoiceId: Id | null;
  onPick: (choiceId: Id) => void;
};

/**
 * One Quick Check question as its kind asks: a prompt with lettered choices,
 * or a verse with a blank and the words that might fill it. Picking,
 * checking, and the reveal all come in as state; this only lays them out.
 */
export function QuickCheckQuestion({
  question,
  selectedChoiceId,
  answeredChoiceId,
  onPick,
}: QuickCheckQuestionProps) {
  const theme = useTheme();
  const answered = answeredChoiceId !== null;
  const lookOf = (choiceId: Id) =>
    getChoiceLook({
      choiceId,
      selectedChoiceId,
      answeredChoiceId,
      correctChoiceId: question.correctChoiceId,
    });
  const verse = question.kind === "finishTheVerse" ? splitVersePrompt(question.prompt) : null;
  const filledId = answeredChoiceId ?? selectedChoiceId;
  const filled = question.choices.find((choice) => choice.id === filledId);
  const filledLook = filledId === null ? "idle" : lookOf(filledId);

  return (
    <View testID="quick-check-question" style={styles.body}>
      <Text style={[theme.typography.metaBody, { color: theme.colors.textMuted }]}>
        {getQuestionKicker(question)}
      </Text>

      {verse ? (
        <>
          <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
            {question.scriptureReference ?? ""}
          </Text>
          <View
            style={[
              styles.verseCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
            ]}
          >
            <Text
              testID="quick-check-verse"
              style={[theme.typography.scripture, { color: theme.colors.text }]}
            >
              {verse.before}
              <Text
                style={[
                  styles.blank,
                  {
                    color:
                      filledLook === "correct"
                        ? theme.colors.correct
                        : filledLook === "incorrect"
                          ? theme.colors.incorrect
                          : theme.colors.text,
                  },
                ]}
              >
                {filled ? filled.text : "    "}
              </Text>
              {verse.after}
            </Text>
          </View>
          <View style={styles.chips}>
            {question.choices.map((choice) => (
              <QuickCheckWordChip
                key={choice.id}
                testID={`quick-check-choice-${choice.label.toLowerCase()}`}
                choice={choice}
                look={lookOf(choice.id)}
                picked={choice.id === answeredChoiceId}
                {...(!answered && { onPress: () => onPick(choice.id) })}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
            {question.prompt}
          </Text>
          <View style={styles.choices}>
            {question.choices.map((choice) => (
              <QuickCheckChoice
                key={choice.id}
                testID={`quick-check-choice-${choice.label.toLowerCase()}`}
                choice={choice}
                look={lookOf(choice.id)}
                picked={choice.id === answeredChoiceId}
                {...(!answered && { onPress: () => onPick(choice.id) })}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  choices: { gap: 12, marginTop: 8 },
  verseCard: { borderWidth: 1, borderRadius: 36, paddingHorizontal: 28, paddingVertical: 24 },
  // The blank, filled or not: an underlined space the chosen words drop into.
  blank: { fontStyle: "italic", textDecorationLine: "underline" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
});
