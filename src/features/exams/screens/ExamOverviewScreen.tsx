import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import type { ExamMode } from "@/types/domain";
import { Button } from "@/ui/Button";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { LinkButton } from "@/ui/LinkButton";
import { PAGE_INSET, Screen } from "@/ui/Screen";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import {
  getExamConceptsForReview,
  getOpenExamAttempt,
  hasRevealedExamAnswers,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { ContentError } from "../components/ContentError";
import { ModeOption } from "../components/ModeOption";
import { getTheologyExam, THEOLOGY_EXAM_ID } from "../data/bundled-exams";
import { getConceptTitle } from "../data/exam-grading";
import { toAttemptItems } from "../logic/attempt";
import { formatDomainAndLevel, formatDuration, formatQuestionCount } from "../logic/labels";
import { examSessionHref } from "../logic/routes";

const SCORE_NOTE =
  "Your score shows how you did on these questions. It doesn't measure spiritual standing, and it isn't a credential.";

/**
 * Theology Exams, from Fun: the exam, what it covers and asks, its sources,
 * and the two ways to take it. Start begins an attempt in the mode picked;
 * an unfinished one in that mode is resumed instead. Content that failed its
 * checks shows why, and can't be started.
 */
export function ExamOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const actions = useStoreActions();
  const parsed = getTheologyExam();
  const examId = parsed.ok ? parsed.exam.summary.id : THEOLOGY_EXAM_ID;
  const [mode, setMode] = useState<ExamMode>("exam");
  const open = useAppSelector((state) => getOpenExamAttempt(state, examId, mode));
  const practice = useAppSelector((state) => hasRevealedExamAnswers(state, examId));
  const review = useAppSelector((state) => getExamConceptsForReview(state, examId));

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

  const { summary } = parsed.exam;
  const sectionLabel = [theme.typography.metaLabel, { color: theme.colors.textMuted }];
  const body = [theme.typography.body, { color: theme.colors.text }];

  function start() {
    if (open) {
      router.push(examSessionHref(open.id));
      return;
    }
    const attemptId = actions.startExamAttempt({
      examId: summary.id,
      examVersion: summary.version,
      mode,
      items: toAttemptItems(parsed.ok ? parsed.exam.questions : []),
    });
    router.push(examSessionHref(attemptId));
  }

  return (
    <Screen testID="exam-overview-screen" padded="vertical">
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inset,
          { gap: theme.spacing.xl, paddingBottom: theme.spacing.xl },
        ]}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={sectionLabel}>{formatDomainAndLevel(summary.domain, summary.level)}</Text>
          <Text
            accessibilityRole="header"
            style={[theme.typography.question, { color: theme.colors.text }]}
          >
            {summary.title}
          </Text>
          <View style={[styles.facts, { gap: theme.spacing.md }]}>
            <Text style={sectionLabel}>{formatQuestionCount(summary.questionCount)}</Text>
            <Text style={sectionLabel}>{formatDuration(summary.durationMinutes)}</Text>
          </View>
          <Text style={[theme.typography.reading, { color: theme.colors.textInactive }]}>
            {summary.overview}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text accessibilityRole="header" style={sectionLabel}>
            What you&apos;ll do
          </Text>
          {summary.objectives.map((objective) => (
            <Text key={objective} style={body}>
              {objective}
            </Text>
          ))}
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text accessibilityRole="header" style={sectionLabel}>
            Areas covered
          </Text>
          {summary.concepts.map((concept) => (
            <Text key={concept} style={body}>
              {concept}
            </Text>
          ))}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Text accessibilityRole="header" style={sectionLabel}>
            Sources
          </Text>
          {summary.sourceLinks.map((link, index) => (
            <LinkButton
              key={link.reference}
              testID={`exam-overview-source-link-${index}`}
              label={link.reference}
              accessibilityHint="Opens the passage in Safari"
              onPress={() => void openPassageLink(link.url)}
            />
          ))}
        </View>

        {review.length > 0 && (
          <View style={{ gap: theme.spacing.sm }}>
            <Text accessibilityRole="header" style={sectionLabel}>
              For review
            </Text>
            {review.map((conceptId) => (
              <Text key={conceptId} style={body}>
                {getConceptTitle(summary.id, conceptId)}
              </Text>
            ))}
          </View>
        )}

        <View style={{ gap: theme.spacing.sm }} accessibilityRole="radiogroup">
          <Text accessibilityRole="header" style={sectionLabel}>
            Choose a mode
          </Text>
          <ModeOption
            testID="exam-overview-mode-exam"
            title="Exam Mode"
            description={summary.modeDescriptions.exam}
            selected={mode === "exam"}
            onPress={() => setMode("exam")}
          />
          <ModeOption
            testID="exam-overview-mode-study"
            title="Study Mode"
            description={summary.modeDescriptions.study}
            selected={mode === "study"}
            onPress={() => setMode("study")}
          />
          {mode === "exam" && practice && !open && (
            <Text style={[theme.typography.cardDetail, { color: theme.colors.textInactive }]}>
              You&apos;ve seen these answers, so this attempt is Practice: it&apos;s scored, but it
              doesn&apos;t count toward concept strengths.
            </Text>
          )}
        </View>

        <Text style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
          {SCORE_NOTE}
        </Text>
      </ScrollView>
      <View style={[styles.inset, { paddingTop: theme.spacing.sm }]}>
        <Button
          testID="exam-overview-start-button"
          label={open ? "Resume" : "Start"}
          onPress={start}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  facts: { flexDirection: "row" },
});
