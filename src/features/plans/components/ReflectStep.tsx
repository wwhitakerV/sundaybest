import { StyleSheet, Text, TextInput, View } from "react-native";
import { Lock } from "lucide-react-native";

import type { Reflection } from "@/types/domain";
import { useTheme } from "@/theme";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";

export type ReflectStepProps = {
  dayNumber: number;
  /** The day's reading title, heading the step. */
  title: string;
  /** The question on this page, and how many the day has. */
  reflection: Reflection;
  total: number;
  /** What's in the answer box now: the user's draft, or the answer saved. */
  answer: string;
  onAnswerChange: (answer: string) => void;
  /** Brings the question in a beat after the title. */
  followStyle?: FollowStyle;
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
  followStyle,
}: ReflectStepProps) {
  const theme = useTheme();

  return (
    <View testID="study-reflect-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label={`Question ${reflection.order} of ${total}`} />
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>{title}</Text>
      <StudyFollow style={followStyle}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
          ]}
        >
          <Text
            style={[
              theme.typography.editorialHeading,
              styles.question,
              { color: theme.colors.text },
            ]}
          >
            {reflection.question}
          </Text>
          <TextInput
            testID={`study-reflect-answer-${reflection.order}`}
            accessibilityLabel={reflection.question}
            multiline
            value={answer}
            onChangeText={onAnswerChange}
            placeholder="Write what comes to mind"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              theme.typography.body,
              styles.answer,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.divider,
              },
            ]}
          />
          <View style={styles.privacy}>
            <Lock size={16} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
            <Text style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
              Only you ever see this.
            </Text>
          </View>
        </View>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  card: { borderWidth: 1, borderRadius: 28, padding: 22, gap: 16 },
  question: { fontSize: 24, lineHeight: 30 },
  answer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    minHeight: 124,
    textAlignVertical: "top",
  },
  privacy: { flexDirection: "row", alignItems: "center", gap: 8 },
});
