import { StyleSheet, View } from "react-native";

import type { Id } from "@/types/domain";
import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { getChoiceLook, getQuestionKicker, splitVersePrompt } from "../logic/quick-check";
import type { QuickCheckQuestionView } from "../types";
import { QuickCheckChoice } from "./QuickCheckChoice";
import { QuickCheckWordChip } from "./QuickCheckWordChip";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { SerifBody } from "@/ui/typography/SerifBody";
import { Span } from "@/ui/typography/Span";

export type QuickCheckQuestionProps = {
  question: QuickCheckQuestionView;
  /** The choice picked and not yet checked, if any. */
  selectedChoiceId: Id | null;
  /** The choice it was answered with, once checked. */
  answeredChoiceId: Id | null;
  onPick: (choiceId: Id) => void;
};

/**
 * One Quick Check question as its kind asks: a prompt with lettered choices,
 * or a verse with a blank and the words that might fill it. The correct answer
 * arrives only after the server checks the submitted choice.
 */
export function QuickCheckQuestion({
  question,
  selectedChoiceId,
  answeredChoiceId,
  onPick,
}: QuickCheckQuestionProps) {
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
      <MonoBody tone="textMuted">{getQuestionKicker(question)}</MonoBody>

      {verse ? (
        <>
          <SFProTitle>{question.scriptureReference ?? ""}</SFProTitle>
          <Card radius={36} style={styles.verseCard}>
            <SerifBody testID="quick-check-verse">
              {verse.before}
              <Span
                italic
                style={styles.blank}
                tone={
                  filledLook === "correct"
                    ? "correct"
                    : filledLook === "incorrect"
                      ? "incorrect"
                      : "text"
                }
              >
                {filled ? filled.text : "    "}
              </Span>
              {verse.after}
            </SerifBody>
          </Card>
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
          <SFProTitle>{question.prompt}</SFProTitle>
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
  body: { gap: space[16] },
  choices: { gap: space[12], marginTop: space[8] },
  verseCard: { paddingHorizontal: space[28], paddingVertical: space[24] },
  blank: { textDecorationLine: "underline" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[12], marginTop: space[8] },
});
