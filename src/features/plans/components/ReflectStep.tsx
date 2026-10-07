import { StyleSheet, View } from "react-native";

import type { StudyReflection } from "../types";
import { radius, space, useTheme } from "@/theme";
import { ReflectionCard } from "@/entities/study";
import { StudyFollow } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyEnter } from "./StudyEnter";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { TextField } from "@/ui/typography/TextField";

export type ReflectStepProps = {
  dayNumber: number;
  /** The day's reading title, heading the step. */
  title: string;
  /** The question on this page, and how many the day has. */
  reflection: StudyReflection;
  total: number;
  /** What's in the answer box now: the user's draft, or the answer saved. */
  answer: string;
  onAnswerChange: (answer: string) => void;
};

/**
 * One page of Daily Study's Reflect step: one of the day's questions, with
 * room to answer. Private. The step pages through the questions in order.
 */
export function ReflectStep({
  dayNumber,
  title,
  reflection,
  total,
  answer,
  onAnswerChange,
}: ReflectStepProps) {
  const theme = useTheme();

  return (
    <View testID="study-reflect-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label={`Question ${reflection.order} of ${total}`} />
      <StudyEnter order={1}>
        <SFProTitle>{title}</SFProTitle>
      </StudyEnter>
      <StudyFollow>
        <ReflectionCard question={reflection.question}>
          <TextField
            testID={`study-reflect-answer-${reflection.order}`}
            accessibilityLabel={reflection.question}
            multiline
            value={answer}
            onChangeText={onAnswerChange}
            placeholder="Write what comes to mind"
            style={[
              styles.answer,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          />
        </ReflectionCard>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
  answer: {
    borderWidth: 1,
    borderRadius: radius[20],
    padding: space[18],
    minHeight: 124,
    textAlignVertical: "top",
  },
});
