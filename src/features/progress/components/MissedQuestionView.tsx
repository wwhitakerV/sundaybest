import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BookOpen, RotateCcw } from "lucide-react-native";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifBody } from "@/ui/typography/SerifBody";
import { ModulePlanRow } from "./ModulePlanRow";
import { ModuleActions } from "./ModuleActions";
import { PartLabel } from "./PartLabel";
import { panelEnter } from "./panel-enter";

export type MissedQuestionViewProps = {
  /** "To revisit · 3 of 12". */
  place: string;
  planTitle: string;
  thumbnailUrl: string | null;
  prompt: string;
  /** What they chose — under the amber mark, or the green one when right — or null if unanswered. */
  chosen: string | null;
  /** They got it right: their answer under the green mark, and no "Correct answer" to repeat it. */
  correct: boolean;
  /** The answers are Scripture's own words: both in the Scripture face; else both in the reading face. */
  scripture: boolean;
  answer: string;
  /** "Open Day 3". */
  studyLabel: string;
  onOpenStudy: () => void;
  /** Its Quick Check taken again, from question 1. */
  onRetake: () => void;
  /** A retake on its way: the pill waits. */
  retaking: boolean;
};

/**
 * A question missed, to revisit, as one module on Settings' group card, a
 * line between its parts: the plan, by its artwork and title; what was
 * asked; what they answered, under an amber dot and label — or that they
 * didn't; the correct answer, under a green dot and label. Hung from it, the
 * day's study and a retake, as pills. Over it, which of them it is. It arrives fading in as it
 * rises (`panelEnter`), as Your words' reflections do.
 */
export function MissedQuestionView({
  place,
  planTitle,
  thumbnailUrl,
  prompt,
  chosen,
  correct,
  scripture,
  answer,
  studyLabel,
  onOpenStudy,
  onRetake,
  retaking,
}: MissedQuestionViewProps) {
  const reduceMotion = useReduceMotion();
  const row = [styles.row, { gap: space[6], padding: space[16] }];

  return (
    <Animated.View
      testID="recall-missed"
      entering={panelEnter(reduceMotion)}
      style={{ gap: space[8] }}
    >
      <SFProBody variant="label" tone="text" style={styles.place}>
        {place}
      </SFProBody>
      {/* The card and what hangs from it, together: the line leaves the card's very edge. */}
      <View>
        <Card radius={24} style={styles.card}>
          <ModulePlanRow title={planTitle} thumbnailUrl={thumbnailUrl} />
          <Divider />
          <View style={row}>
            <PartLabel>You were asked</PartLabel>
            <SFProBody variant="reading">{prompt}</SFProBody>
          </View>
          <Divider />
          <View style={row}>
            {chosen === null ? (
              <SFProBody variant="reading" tone="textSupporting">
                You didn't answer this one.
              </SFProBody>
            ) : (
              <>
                <PartLabel mark={correct ? "correct" : "incorrect"}>
                  {correct ? "You answered correctly" : "You answered"}
                </PartLabel>
                <AnswerText scripture={scripture}>{chosen}</AnswerText>
              </>
            )}
          </View>
          {/* Got right, their answer is the correct one: nothing to repeat. */}
          {!correct && (
            <>
              <Divider />
              <View style={row}>
                <PartLabel mark="correct">Correct answer</PartLabel>
                <AnswerText scripture={scripture}>{answer}</AnswerText>
              </View>
            </>
          )}
        </Card>
        {/* Hung from the card: the day's study, a line down into it, and the retake beside it. */}
        <ModuleActions
          primary={{
            testID: "recall-study",
            label: studyLabel,
            icon: BookOpen,
            onPress: onOpenStudy,
          }}
          secondary={{
            testID: "recall-retake",
            label: "Retake",
            icon: RotateCcw,
            onPress: onRetake,
            disabled: retaking,
          }}
        />
      </View>
    </Animated.View>
  );
}

/** An answer, theirs or the right one: the Scripture face for Scripture's words, the reading face for the rest. */
function AnswerText({ children, scripture }: { children: string; scripture: boolean }) {
  return scripture ? (
    <SerifBody variant="standfirst">{children}</SerifBody>
  ) : (
    <SFProBody variant="reading">{children}</SFProBody>
  );
}

const styles = StyleSheet.create({
  // In line with the words inside the card, and clear of the rounded edge it scrolls under.
  place: { paddingHorizontal: space[16] },
  card: { overflow: "hidden" },
  row: { alignItems: "stretch" },
});
