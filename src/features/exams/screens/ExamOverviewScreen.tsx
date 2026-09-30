import { useContext, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { ArrowLeft, BookOpen, Clock, Info, ListChecks } from "lucide-react-native";

import type { ExamMode } from "@/types/domain";
import { Divider } from "@/ui/Divider";
import { FactRow } from "@/ui/FactRow";
import { FloatingBar } from "@/ui/FloatingBar";
import { FloatingButton } from "@/ui/FloatingButton";
import { getFloatingNavBarClearance } from "@/ui/floatingNavBar";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { PillButton } from "@/ui/PillButton";
import { PAGE_INSET, Screen } from "@/ui/Screen";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { getExamConceptsForReview, useAppSelector } from "@/core/store";
import { ContentError } from "../components/ContentError";
import { ExamUnavailable } from "../components/ExamUnavailable";
import { ModeChoice } from "../components/ModeChoice";
import { StandingPanel } from "../components/StandingPanel";
import { getBundledExam } from "../data/bundled-exams";
import { getConceptTitle } from "../data/exam-grading";
import { useExamRouteParams } from "../hooks/use-exam-route";
import { useExamStanding } from "../hooks/use-exam-standing";
import { useStartAttempt } from "../hooks/use-start-attempt";
import {
  formatDomainAndLevel,
  formatDuration,
  formatPassageCount,
  formatQuestionCount,
} from "../logic/labels";
import { describeReview, getReviewQuestions } from "../logic/course";
import {
  examPassagesHref,
  examResultsHref,
  examSessionHref,
  examTopicsHref,
} from "../logic/routes";
import { describeBeginAction, getStartingMode, type ExamAction } from "../logic/standing";

const PRACTICE_NOTE =
  "You've seen these answers, so a new exam is Practice: it's scored, but it doesn't count toward concept strengths.";

/**
 * An exam's full overview, pushed above the tabs. Its topic and level, its
 * title in the editorial face and the question it asks, and its questions,
 * time, and passages on one line; where the learner stands, once they've
 * begun; then how to begin — Exam or Study side by side, one picked, and
 * what it's like under them — and, pinned to the foot of the screen, its
 * topics and its passages, each opening in a half-height sheet. Its
 * action floats where every bar in the app does, the page fading out behind
 * it: it follows the pick and the learner's history
 * (`describeBeginAction`), with View results beside it once an exam's been
 * submitted. Content that failed its checks shows why, and can't be begun;
 * an exam that isn't bundled shows as unavailable.
 */
export function ExamOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const start = useStartAttempt();
  const { examId } = useExamRouteParams();
  const parsed = examId ? getBundledExam(examId) : null;
  const { standing, history, openExam, openStudy, latestExam } = useExamStanding(examId ?? "");
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const review = useAppSelector((state) => getExamConceptsForReview(state, examId ?? ""));
  // Unpicked, it's whichever the learner's history starts on.
  const [picked, setPicked] = useState<ExamMode | null>(null);

  const header = (
    <View style={styles.inset}>
      <ScreenHeader
        title=""
        left={
          <HeaderIconButton
            testID="exam-overview-back-button"
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
        }
      />
    </View>
  );

  if (!parsed) {
    return (
      <Screen testID="exam-overview-screen" padded="vertical">
        {header}
        <View style={[styles.inset, styles.fill]}>
          <ExamUnavailable
            testID="exam-overview-unavailable"
            message="This exam isn't available yet."
            actionLabel="Back to exams"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  if (!parsed.ok) {
    return (
      <Screen testID="exam-overview-screen" padded="vertical">
        {header}
        <View style={styles.inset}>
          <ContentError issues={parsed.issues} />
        </View>
      </Screen>
    );
  }

  const { exam } = parsed;
  const { summary, questions } = exam;
  const mode = picked ?? getStartingMode(history);
  const action = describeBeginAction(history, mode);
  const tracked = [theme.typography.kicker, { color: theme.colors.textMuted }];

  function begin(chosen: ExamMode, only?: typeof questions) {
    router.push(examSessionHref(start(exam, chosen, only)));
  }

  const reviewLabel = describeReview(review.length, openStudy !== null);

  function act({ kind }: ExamAction) {
    switch (kind) {
      case "resumeExam":
        if (openExam) router.push(examSessionHref(openExam.id));
        return;
      case "continueStudy":
        if (openStudy) router.push(examSessionHref(openStudy.id));
        return;
      case "beginStudy":
        begin("study");
        return;
      case "beginExam":
      case "beginPractice":
        begin("exam");
        return;
    }
  }

  const section = (label: string, content: ReactNode, testID?: string) => (
    <View testID={testID} style={{ gap: theme.spacing.md }}>
      <Text accessibilityRole="header" style={tracked}>
        {label}
      </Text>
      {content}
    </View>
  );

  return (
    <Screen testID="exam-overview-screen" padded="vertical">
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inset,
          {
            // Fills the screen at least, so what's pinned to its foot sits there.
            flexGrow: 1,
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            // Clear of the floating bar, and the fade above it.
            paddingBottom: getFloatingNavBarClearance(insetBottom) + theme.spacing.lg,
          },
        ]}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={tracked}>{formatDomainAndLevel(summary.domain, summary.level)}</Text>
          <Text
            accessibilityRole="header"
            style={[theme.typography.editorialDisplay, { color: theme.colors.text }]}
          >
            {summary.title}
          </Text>
          <Text style={[theme.typography.editorialLead, { color: theme.colors.textInactive }]}>
            {summary.question ?? summary.overview}
          </Text>
          <View style={{ marginTop: theme.spacing.md }}>
            <FactRow
              testID="exam-overview-facts"
              facts={[
                {
                  key: "questions",
                  icon: ListChecks,
                  label: formatQuestionCount(summary.questionCount),
                },
                { key: "duration", icon: Clock, label: formatDuration(summary.durationMinutes) },
                {
                  key: "passages",
                  icon: BookOpen,
                  label: formatPassageCount(summary.sourceLinks.length),
                },
              ]}
            />
          </View>
        </View>

        {standing.status && (
          <StandingPanel
            testID="exam-overview-standing"
            status={standing.status}
            active={standing.state === "inProgress"}
            review={review.map((conceptId) => getConceptTitle(summary.id, conceptId))}
            reviewAction={
              reviewLabel
                ? {
                    testID: "exam-overview-review-button",
                    label: reviewLabel,
                    onPress: () => begin("study", getReviewQuestions(questions, review)),
                  }
                : null
            }
          />
        )}

        <Divider />
        {section(
          "Choose how to begin",
          <>
            <ModeChoice testID="exam-overview-mode" selected={mode} onSelect={setPicked} />
            {action.kind === "beginPractice" && (
              <Text style={[theme.typography.cardDetail, { color: theme.colors.textInactive }]}>
                {PRACTICE_NOTE}
              </Text>
            )}
          </>,
          "exam-overview-begin",
        )}

        <View testID="exam-overview-more" style={[styles.more, { gap: theme.spacing.sm }]}>
          {summary.explore.length > 0 && (
            <PillButton
              testID="exam-overview-topics-button"
              icon={Info}
              label="Topics covered"
              onPress={() => router.push(examTopicsHref(summary.id))}
            />
          )}
          <PillButton
            testID="exam-overview-passages-button"
            icon={BookOpen}
            label="Passages"
            onPress={() => router.push(examPassagesHref(summary.id))}
          />
        </View>
      </ScrollView>

      <FloatingBar testID="exam-overview-bar">
        {latestExam && (
          <FloatingButton
            testID="exam-overview-secondary-button"
            label="View results"
            quiet
            onPress={() => router.push(examResultsHref(latestExam.id))}
          />
        )}
        <FloatingButton
          testID="exam-overview-start-button"
          label={action.label}
          primary
          onPress={() => act(action)}
        />
      </FloatingBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  fill: { flex: 1 },
  // Pinned to the foot of the screen, above the floating bar — or after the rest, when there's more.
  more: { flexDirection: "row", marginTop: "auto" },
});
