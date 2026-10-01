import { useContext, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import type { ExamAttempt, ExamResponse } from "@/types/domain";
import { Button } from "@/ui/atoms/Button";
import { FloatingBar } from "@/ui/FloatingBar";
import { FloatingButton } from "@/ui/atoms/FloatingButton";
import { getFloatingNavBarClearance } from "@/ui/organisms/floatingNavBar";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { StepCounter } from "@/ui/atoms/StepCounter";
import { useTheme } from "@/theme";
import {
  getExamAttempt,
  getExamItemResponse,
  isExamQuestionRevealed,
  isExamResponseComplete,
  useAppSelector,
} from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { ChoiceControl } from "../components/ChoiceControl";
import { ExamPreface } from "../components/ExamPreface";
import { ExamProgress } from "../components/ExamProgress";
import { ExamUnavailable } from "../components/ExamUnavailable";
import { MatchingControl } from "../components/MatchingControl";
import { OrderingControl } from "../components/OrderingControl";
import { QuestionStem } from "../components/QuestionStem";
import { StudyFeedback } from "../components/StudyFeedback";
import { SubmitReview } from "../components/SubmitReview";
import { getBundledExam } from "../data/bundled-exams";
import { getQuestionReveal } from "../data/exam-grading";
import { useExamRouteParams } from "../hooks/use-exam-route";
import { useExamSession } from "../hooks/use-exam-session";
import { getDoneCount, getResumeIndex, getUndoneNumbers, hasBegun } from "../logic/attempt";
import { describePreface } from "../logic/course";
import { formatModeLabel } from "../logic/labels";
import {
  examOverviewHref,
  examResultsHref,
  theologyExamsHref,
  understandWhyHref,
} from "../logic/routes";
import type { ExamQuestion, QuestionReveal } from "../types";

function Control(props: {
  question: ExamQuestion;
  response: ExamResponse | null;
  reveal: QuestionReveal | null;
  onChange?: (response: ExamResponse) => void;
}) {
  const { question, ...rest } = props;
  switch (question.kind) {
    case "matching":
      return <MatchingControl question={question} {...rest} />;
    case "ordering":
      return <OrderingControl question={question} {...rest} />;
    default:
      return <ChoiceControl question={question} {...rest} />;
  }
}

/**
 * An attempt, one question at a time: the question, its passages, and the
 * control for its kind. Previous and next keep every response. A fresh
 * attempt opens on its preface (`ExamPreface`) — the conditions it's sat
 * under — and its Start.
 *
 * Exam Mode saves each response silently — never a verdict — and ends in a
 * review and a confirmed submission, then the results. Study Mode checks each
 * answer as it's given, shows the verdict and why, and finishes once every
 * answer's been checked. The store decides what may change; grading happens
 * in the grading seam.
 */
export function ExamSessionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { attemptId } = useExamRouteParams();
  const attempt = useAppSelector((state) => (attemptId ? getExamAttempt(state, attemptId) : null));
  const session = useExamSession(attempt);
  // The attempt's own exam — unavailable when it isn't bundled, or fails its checks.
  const parsed = attempt ? getBundledExam(attempt.examId) : null;
  const [index, setIndex] = useState(() => (attempt ? getResumeIndex(attempt) : 0));
  const [page, setPage] = useState<"preface" | "question" | "review">(() =>
    attempt && !hasBegun(attempt) ? "preface" : "question",
  );
  const [confirming, setConfirming] = useState(false);
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  // Back to the exam's overview — or, with no attempt to say which, the exams page.
  const close = () =>
    router.dismissTo(attempt ? examOverviewHref(attempt.examId) : theologyExamsHref);
  const header = (right: string, title: string) => (
    <View style={styles.inset}>
      <ScreenHeader
        title={title}
        left={
          <HeaderIconButton
            testID="exam-session-close-button"
            icon={X}
            accessibilityLabel="Close"
            onPress={close}
          />
        }
        right={right ? <StepCounter label={right} /> : undefined}
      />
    </View>
  );

  const item = attempt?.items.at(index);
  const question =
    parsed?.ok && item
      ? parsed.exam.questions.find((entry) => entry.id === item.questionId)
      : undefined;

  if (!attempt || !parsed?.ok || !item || !question || attempt.status === "completed") {
    return (
      <Screen testID="exam-session-screen" padded="vertical">
        {header("", "")}
        <ExamUnavailable
          testID="exam-session-unavailable"
          message={
            attempt?.status === "completed"
              ? "This attempt is finished."
              : "This exam session isn't here any more."
          }
          actionLabel={attempt?.status === "completed" ? "See results" : "Back to Theology Exams"}
          onAction={() =>
            attempt?.status === "completed" ? router.replace(examResultsHref(attempt.id)) : close()
          }
        />
      </Screen>
    );
  }

  const total = attempt.items.length;
  const study = attempt.mode === "study";
  const title = formatModeLabel(attempt.mode, attempt.practice);

  if (page === "preface") {
    const whole = total === parsed.exam.questions.length;
    const preface = describePreface({
      mode: attempt.mode,
      count: total,
      duration: whole ? parsed.exam.summary.durationMinutes : null,
    });
    return (
      <Screen testID="exam-session-screen" padded="vertical">
        {header("", "")}
        <ScrollView
          contentContainerStyle={[
            styles.inset,
            {
              paddingTop: theme.spacing.lg,
              paddingBottom: getFloatingNavBarClearance(insetBottom) + theme.spacing.lg,
            },
          ]}
        >
          <ExamPreface
            testID="exam-session-preface"
            kicker={title}
            title={parsed.exam.summary.title}
            lines={preface.lines}
          />
        </ScrollView>
        <FloatingBar testID="exam-session-bar">
          <FloatingButton
            testID="exam-session-start-button"
            label={preface.start}
            primary
            onPress={() => setPage("question")}
          />
        </FloatingBar>
      </Screen>
    );
  }

  if (page === "review") {
    return (
      <Screen testID="exam-session-screen" padded="vertical">
        {header("Review", title)}
        <ScrollView contentContainerStyle={[styles.inset, { paddingBottom: theme.spacing.xl }]}>
          <SubmitReview
            rows={attempt.items.map((entry, position) => ({
              questionId: entry.questionId,
              number: position + 1,
              answered: isExamResponseComplete(
                entry,
                getExamItemResponse(attempt, entry.questionId)?.response,
              ),
            }))}
            confirming={confirming}
            onOpenQuestion={(number) => {
              setConfirming(false);
              setIndex(number - 1);
              setPage("question");
            }}
            onSubmit={() => setConfirming(true)}
            onConfirm={() => {
              if (session.finish()) router.replace(examResultsHref(attempt.id));
            }}
            onCancel={() => setConfirming(false)}
          />
        </ScrollView>
      </Screen>
    );
  }

  const entry = getExamItemResponse(attempt, question.id);
  const response = entry?.response ?? null;
  const reveal = isExamQuestionRevealed(attempt, question.id)
    ? getQuestionReveal(attempt.examId, question.id)
    : null;
  const complete = isExamResponseComplete(item, response);
  const isLast = index === total - 1;

  return (
    <Screen testID="exam-session-screen" padded="vertical">
      {header(`${index + 1} of ${total}`, title)}
      <View style={[styles.inset, { paddingBottom: theme.spacing.md }]}>
        <ExamProgress done={getDoneCount(attempt)} total={total} mode={attempt.mode} />
      </View>
      <ScrollView
        key={question.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inset,
          {
            gap: theme.spacing.lg,
            // Clear of the floating bar, and the fade above it.
            paddingBottom: getFloatingNavBarClearance(insetBottom) + theme.spacing.lg,
          },
        ]}
      >
        <QuestionStem
          number={index + 1}
          total={total}
          kind={question.kind}
          stem={question.stem}
          passages={question.passages}
          onOpenPassage={(url) => void openPassageLink(url)}
        />
        <Control
          question={question}
          response={response}
          reveal={reveal}
          {...(!reveal && { onChange: (next: ExamResponse) => session.record(question.id, next) })}
        />
        {study && !entry?.check && (
          <Button
            testID="exam-check-button"
            label="Check answer"
            disabled={!complete}
            onPress={() => session.check(question.id)}
          />
        )}
        {isLast && study && getUndoneNumbers(attempt).length > 0 && (
          <Text
            style={[theme.typography.metaBody, styles.centred, { color: theme.colors.textMuted }]}
          >
            Check every answer to see your results.
          </Text>
        )}
        {!study && complete && (
          <Text style={[theme.typography.metaLabel, { color: theme.colors.textMuted }]}>
            Answer saved
          </Text>
        )}
        {study && entry?.check && reveal && parsed.ok && (
          <StudyFeedback
            correct={entry.check.correct}
            whyCorrect={reveal.whyCorrect}
            actionLabel={parsed.exam.rules.actionLabel}
            onUnderstandWhy={() => router.push(understandWhyHref(attempt.id, question.id))}
          />
        )}
      </ScrollView>
      <FloatingBar testID="exam-session-bar">
        <Navigation
          attempt={attempt}
          index={index}
          isLast={isLast}
          onPrevious={() => setIndex(index - 1)}
          onNext={() => {
            if (!isLast) setIndex(index + 1);
            else if (!study) setPage("review");
            else if (session.finish()) router.replace(examResultsHref(attempt.id));
          }}
        />
      </FloatingBar>
    </Screen>
  );
}

/** Previous and Next, in the floating bar: Next the primary — Review answers, or See results, on the last. */
function Navigation(props: {
  attempt: ExamAttempt;
  index: number;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { attempt, index, isLast, onPrevious, onNext } = props;
  const study = attempt.mode === "study";
  const unchecked = study ? getUndoneNumbers(attempt).length : 0;
  const nextLabel = isLast ? (study ? "See results" : "Review answers") : "Next";

  return (
    <>
      <FloatingButton
        testID="exam-previous-button"
        label="Previous"
        quiet
        disabled={index === 0}
        onPress={onPrevious}
      />
      <FloatingButton
        testID="exam-next-button"
        label={nextLabel}
        primary
        disabled={isLast && study && unchecked > 0}
        onPress={onNext}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  centred: { textAlign: "center" },
});
