import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/ui/Button";
import { Divider } from "@/ui/Divider";
import { PAGE_INSET, Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";
import {
  getExamAttempt,
  getExamItemResponse,
  getMissedConcepts,
  useAppSelector,
} from "@/core/store";
import { ConceptRow } from "../components/ConceptRow";
import { ExamUnavailable } from "../components/ExamUnavailable";
import { ResultItem } from "../components/ResultItem";
import { getTheologyExam } from "../data/bundled-exams";
import { getConceptTitle, getQuestionReveal } from "../data/exam-grading";
import { useExamRouteParams } from "../hooks/use-exam-route";
import { describeAnswer } from "../logic/attempt";
import { formatModeLabel } from "../logic/labels";
import { theologyExamsHref, understandWhyHref } from "../logic/routes";

/**
 * A finished attempt's results, as recorded when it finished. Exam Mode: the
 * score, its percentage, and its band. Study Mode: how many were right, and
 * that it isn't scored. Then each concept's evidence, what's for review, and
 * every question — the user's answer, the right one, why, and Understand why.
 * No celebration: plain type and divided lists.
 */
export function ExamResultsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { attemptId } = useExamRouteParams();
  const attempt = useAppSelector((state) => (attemptId ? getExamAttempt(state, attemptId) : null));
  const parsed = getTheologyExam();
  const done = () => router.dismissTo(theologyExamsHref);

  if (!attempt?.result || !parsed.ok) {
    return (
      <Screen testID="exam-results-screen" padded>
        <ExamUnavailable
          testID="exam-results-unavailable"
          message="These results aren't here any more."
          actionLabel="Back to Theology Exams"
          onAction={done}
        />
      </Screen>
    );
  }

  const { result } = attempt;
  const study = attempt.mode === "study";
  const label = [theme.typography.metaLabel, { color: theme.colors.textMuted }];
  const kicker = formatModeLabel(attempt.mode, attempt.practice);
  const missed = getMissedConcepts(attempt);

  return (
    <Screen testID="exam-results-screen" padded="vertical">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inset,
          { gap: theme.spacing.xl, paddingVertical: theme.spacing.lg },
        ]}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={label}>{kicker}</Text>
          <Text
            accessibilityRole="header"
            style={[theme.typography.question, { color: theme.colors.text }]}
          >
            {parsed.exam.summary.title}
          </Text>
        </View>

        <View testID="exam-results-score" style={{ gap: theme.spacing.xs }}>
          {study ? (
            <>
              <Text style={[theme.typography.editorialTitle, { color: theme.colors.text }]}>
                {`${result.correct} of ${result.total} correct`}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textInactive }]}>
                Study Mode isn&apos;t scored.
              </Text>
            </>
          ) : (
            <View style={[styles.row, { gap: theme.spacing.md }]}>
              <Text style={[theme.typography.editorialTitle, { color: theme.colors.text }]}>
                {`${result.correct} of ${result.total}`}
              </Text>
              <Text style={[theme.typography.editorialTitle, { color: theme.colors.text }]}>
                {`${result.percentage}%`}
              </Text>
            </View>
          )}
        </View>
        {!study && result.band !== null && (
          <Text
            testID="exam-results-band"
            style={[theme.typography.stepTitle, { color: theme.colors.text }]}
          >
            {result.band}
          </Text>
        )}

        <View>
          <Text accessibilityRole="header" style={label}>
            Concepts
          </Text>
          {result.concepts.map((concept, index) => (
            <View key={concept.conceptId}>
              {index > 0 && <Divider />}
              <ConceptRow
                testID={`exam-results-concept-${concept.conceptId}`}
                title={getConceptTitle(attempt.examId, concept.conceptId)}
                correct={concept.correct}
                total={concept.total}
                label={concept.label}
              />
            </View>
          ))}
        </View>

        {missed.length > 0 && (
          <View testID="exam-results-review" style={{ gap: theme.spacing.sm }}>
            <Text accessibilityRole="header" style={label}>
              For review
            </Text>
            {missed.map((conceptId) => (
              <Text key={conceptId} style={[theme.typography.body, { color: theme.colors.text }]}>
                {getConceptTitle(attempt.examId, conceptId)}
              </Text>
            ))}
          </View>
        )}

        <View>
          <Text accessibilityRole="header" style={label}>
            Questions
          </Text>
          {result.items.map((entry, index) => {
            const question = parsed.exam.questions.find(
              (candidate) => candidate.id === entry.questionId,
            );
            const reveal = getQuestionReveal(attempt.examId, entry.questionId);
            if (!question || !reveal) return null;
            const response = getExamItemResponse(attempt, entry.questionId)?.response ?? null;
            return (
              <View key={entry.questionId}>
                {index > 0 && <Divider />}
                <ResultItem
                  testID={`exam-results-item-${entry.questionId}`}
                  number={index + 1}
                  stem={question.stem}
                  correct={entry.correct}
                  yourAnswer={describeAnswer(question, response)}
                  correctAnswer={describeAnswer(question, reveal.key) ?? ""}
                  whyCorrect={reveal.whyCorrect}
                  actionLabel={parsed.exam.rules.actionLabel}
                  onUnderstandWhy={() =>
                    router.push(understandWhyHref(attempt.id, entry.questionId))
                  }
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
      <View style={[styles.inset, { paddingTop: theme.spacing.sm }]}>
        <Button testID="exam-results-done-button" label="Done" onPress={done} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  row: { flexDirection: "row", alignItems: "baseline" },
});
