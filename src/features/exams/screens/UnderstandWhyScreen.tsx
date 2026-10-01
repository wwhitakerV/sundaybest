import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { LinkButton } from "@/ui/LinkButton";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { useTheme } from "@/theme";
import { getExamAttempt, isExamQuestionRevealed, useAppSelector } from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { getQuestionReveal } from "../data/exam-grading";
import { useExamRouteParams } from "../hooks/use-exam-route";

const RULE_WIDTH = 2;

/**
 * Understand why: a question's teaching as a focused study page — the
 * concept, the passages to read in context (links only, never passage text),
 * the important distinction, and a line to remember. Only once that answer
 * has been revealed; before, it says so and shows nothing more.
 */
export function UnderstandWhyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { attemptId, questionId } = useExamRouteParams();
  const attempt = useAppSelector((state) => (attemptId ? getExamAttempt(state, attemptId) : null));
  const revealed =
    attempt !== null && questionId !== null && isExamQuestionRevealed(attempt, questionId);
  const reveal =
    revealed && attempt && questionId ? getQuestionReveal(attempt.examId, questionId) : null;
  const label = [theme.typography.metaLabel, { color: theme.colors.textMuted }];

  return (
    <Screen testID="exam-why-screen" padded="vertical">
      <View style={styles.inset}>
        <ScreenHeader
          title=""
          left={
            <HeaderIconButton
              testID="exam-why-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={() => router.back()}
            />
          }
        />
      </View>
      {reveal ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.inset,
            styles.page,
            { gap: theme.spacing.xl, paddingBottom: theme.spacing.xl },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[theme.typography.question, { color: theme.colors.text }]}
          >
            {reveal.teaching.title}
          </Text>
          <Text style={[theme.typography.reading, { color: theme.colors.text }]}>
            {reveal.teaching.concept}
          </Text>

          <View style={{ gap: theme.spacing.md }}>
            <Text accessibilityRole="header" style={label}>
              Biblical grounding
            </Text>
            {reveal.teaching.grounding.map((passage, index) => (
              <LinkButton
                key={passage.reference}
                testID={`exam-why-passage-link-${index}`}
                label={passage.reference}
                accessibilityHint="Opens the passage in Safari"
                onPress={() => void openPassageLink(passage.url)}
              />
            ))}
          </View>

          <View
            style={{
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text accessibilityRole="header" style={label}>
              Important distinction
            </Text>
            <Text style={[theme.typography.reading, { color: theme.colors.text }]}>
              {reveal.teaching.importantDistinction}
            </Text>
          </View>

          <View
            style={[
              styles.remember,
              {
                borderLeftColor: theme.colors.accent,
                paddingLeft: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Text accessibilityRole="header" style={label}>
              Remember this
            </Text>
            <Text style={[theme.typography.pullLine, { color: theme.colors.text }]}>
              {reveal.teaching.rememberThis}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View testID="exam-why-locked" style={[styles.inset, styles.locked]}>
          <Text
            style={[theme.typography.body, styles.centred, { color: theme.colors.textInactive }]}
          >
            This opens once the answer&apos;s been revealed — after you check it in Study Mode, or
            submit the exam.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  /** A comfortable measure for reading. */
  page: { maxWidth: 560 },
  remember: { borderLeftWidth: RULE_WIDTH },
  locked: { flex: 1, justifyContent: "center" },
  centred: { textAlign: "center" },
});
