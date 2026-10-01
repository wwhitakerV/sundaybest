import { useContext } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, RotateCcw } from "lucide-react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { FloatingBar } from "@/ui/FloatingBar";
import { FloatingButton } from "@/ui/atoms/FloatingButton";
import { getFloatingNavBarClearance } from "@/ui/organisms/floatingNavBar";
import { Divider } from "@/ui/atoms/Divider";
import { LinkRow } from "@/ui/LinkRow";
import { PillButton } from "@/ui/PillButton";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { useTheme } from "@/theme";
import {
  getExamAttempt,
  getExamItemResponse,
  getMissedConcepts,
  getOpenExamAttempt,
  useAppSelector,
} from "@/core/store";
import { ConceptRow } from "../components/ConceptRow";
import { ExamUnavailable } from "../components/ExamUnavailable";
import { ResultItem } from "../components/ResultItem";
import { getBundledExam } from "../data/bundled-exams";
import { SUBJECTS } from "../data/catalog";
import { getConceptTitle, getQuestionReveal } from "../data/exam-grading";
import { useExamRouteParams } from "../hooks/use-exam-route";
import { useStartAttempt } from "../hooks/use-start-attempt";
import { describeAnswer } from "../logic/attempt";
import { formatLevelName } from "../logic/catalog";
import { describeReview, findNextExam, getReviewQuestions } from "../logic/course";
import { formatModeLabel } from "../logic/labels";
import {
  examOverviewHref,
  examSessionHref,
  theologyExamsHref,
  understandWhyHref,
} from "../logic/routes";

/**
 * A finished attempt's results, as recorded when it finished. Exam Mode: the
 * score, its percentage, and its band. Study Mode: how many were right, and
 * that it isn't scored. Then each concept's evidence, what's for review, and
 * every question — the user's answer, the right one, why, and Understand why.
 * What's next, before the questions: a short study of just what was missed,
 * and the next level up in the course.
 * No celebration: plain type and divided lists.
 */
export function ExamResultsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { attemptId } = useExamRouteParams();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const attempt = useAppSelector((state) => (attemptId ? getExamAttempt(state, attemptId) : null));
  const start = useStartAttempt();
  const studyOpen = useAppSelector(
    (state) => attempt !== null && getOpenExamAttempt(state, attempt.examId, "study") !== null,
  );
  // The attempt's own exam — unavailable when it isn't bundled, or fails its checks.
  const parsed = attempt ? getBundledExam(attempt.examId) : null;
  // Back to the exam's overview — where its concepts for review wait — or, with no attempt, the exams page.
  const done = () =>
    router.dismissTo(attempt ? examOverviewHref(attempt.examId) : theologyExamsHref);

  if (!attempt?.result || !parsed?.ok) {
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
  const label = [theme.typography.kicker, { color: theme.colors.textMuted }];
  const kicker = formatModeLabel(attempt.mode, attempt.practice);
  const missed = getMissedConcepts(attempt);
  const reviewLabel = describeReview(missed.length, studyOpen);
  const next = findNextExam(SUBJECTS, attempt.examId);

  return (
    <Screen testID="exam-results-screen" padded="vertical">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inset,
          {
            gap: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
            // Clear of the floating bar, and the fade above it.
            paddingBottom: getFloatingNavBarClearance(insetBottom) + theme.spacing.lg,
          },
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

        {(reviewLabel || next) && (
          <View testID="exam-results-whats-next" style={{ gap: theme.spacing.md }}>
            <Text accessibilityRole="header" style={label}>
              What&apos;s next
            </Text>
            {reviewLabel && (
              <View style={styles.action}>
                <PillButton
                  testID="exam-results-review-button"
                  icon={RotateCcw}
                  label={reviewLabel}
                  onPress={() =>
                    router.replace(
                      examSessionHref(
                        start(
                          parsed.exam,
                          "study",
                          getReviewQuestions(parsed.exam.questions, missed),
                        ),
                      ),
                    )
                  }
                />
              </View>
            )}
            {next && (
              <LinkRow
                testID="exam-results-next"
                icon={ArrowRight}
                label={`${next.title} · ${formatLevelName(next.level)}`}
                accessibilityHint="Opens the next exam in the course"
                onPress={() => router.dismissTo(examOverviewHref(next.examId))}
              />
            )}
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
      <FloatingBar testID="exam-results-bar">
        <FloatingButton testID="exam-results-done-button" label="Done" primary onPress={done} />
      </FloatingBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  row: { flexDirection: "row", alignItems: "baseline" },
  action: { flexDirection: "row" },
});
