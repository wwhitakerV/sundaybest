import { StyleSheet, View } from "react-native";

import type { StudyReflection } from "../types";
import { space } from "@/theme";
import { ReflectionCard } from "@/entities/study";
import { StudyFollow } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyEnter } from "./StudyEnter";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { TextBox } from "@/ui/molecules/TextBox";

/** The answer box's least height: room for a few lines before it grows. */
const ANSWER_LEAST = 124;

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
  return (
    <View testID="study-reflect-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label={`Question ${reflection.order} of ${total}`} />
      <StudyEnter order={1}>
        <SFProTitle>{title}</SFProTitle>
      </StudyEnter>
      <StudyFollow>
        <ReflectionCard question={reflection.question}>
          <TextBox
            testID={`study-reflect-answer-${reflection.order}`}
            accessibilityLabel={reflection.question}
            value={answer}
            onChangeText={onAnswerChange}
            placeholder="Write what comes to mind"
            minHeight={ANSWER_LEAST}
          />
        </ReflectionCard>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
});
