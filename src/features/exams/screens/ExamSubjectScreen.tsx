import { useContext } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";

import { DividedList } from "@/ui/DividedList";
import { getFloatingNavBarClearance } from "@/ui/organisms/floatingNavBar";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { useTheme } from "@/theme";
import { openPassageLink } from "@/core/links/open-passage-link";
import { ExamUnavailable } from "../components/ExamUnavailable";
import { PassageList } from "../components/PassageList";
import { SubjectExamRow } from "../components/SubjectExamRow";
import { SUBJECTS } from "../data/catalog";
import { useExamReviewCounts, useExamStandings } from "../hooks/use-exam-standing";
import { useSubject } from "../hooks/use-subject";
import { formatExamCountInWords, formatLevelName, formatSubjectPosition } from "../logic/catalog";
import { buildSyllabus, formatReviewDue } from "../logic/course";
import { getNextExam } from "../logic/progress";
import { examOverviewHref } from "../logic/routes";

/**
 * A subject's exams, from its book on the exams page: its place among the
 * subjects, its name, how many exams it holds, then each exam a row
 * (`SubjectExamRow`) — its level, its title, what it asks (or that it isn't
 * available yet), and where the learner stands with it — opening its
 * overview. The next to take is marked: Start here, or Continue
 * (`getNextExam`), and what waits for review on each is said. Then, as a
 * syllabus, what the exams will have the learner able to do, and a reading
 * list of their passages (`buildSyllabus`). A subject it hasn't shows as
 * unavailable.
 */
export function ExamSubjectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const found = useSubject();
  const kicker = [theme.typography.kicker, { color: theme.colors.textMuted }];
  const examIds = found?.exams.map(({ exam }) => exam.examId) ?? [];
  const standings = useExamStandings(examIds);
  const reviewCounts = useExamReviewCounts(examIds);
  const syllabus = buildSyllabus(found?.exams ?? []);
  const next = getNextExam(
    (found?.exams ?? []).map(({ summary }, row) => ({
      available: summary !== null,
      state: standings.at(row)?.state ?? "notStarted",
    })),
  );

  return (
    <Screen testID="exam-subject-screen" padded="vertical">
      <View style={styles.inset}>
        <ScreenHeader
          title=""
          left={
            <HeaderIconButton
              testID="exam-subject-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={() => router.back()}
            />
          }
        />
      </View>

      {found ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.inset,
            {
              gap: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: getFloatingNavBarClearance(insetBottom) + theme.spacing.lg,
            },
          ]}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={[theme.typography.kicker, { color: theme.colors.textMuted }]}>
              Subject {formatSubjectPosition(found.index, SUBJECTS.length)}
            </Text>
            <Text
              accessibilityRole="header"
              style={[theme.typography.editorialDisplay, { color: theme.colors.text }]}
            >
              {found.subject.title}
            </Text>
            <Text style={[theme.typography.summaryStrong, { color: theme.colors.textInactive }]}>
              {`${formatExamCountInWords(found.subject.exams.length)} · taken in order, each going deeper`}
            </Text>
          </View>

          <DividedList>
            {found.exams.map(({ exam, summary }, row) => (
              <SubjectExamRow
                key={exam.examId}
                testID={`exam-subject-item-${exam.examId}`}
                level={formatLevelName(exam.level)}
                title={exam.title}
                summary={summary}
                status={standings.at(row)?.status ?? null}
                reviewDue={formatReviewDue(reviewCounts.at(row) ?? 0)}
                next={next?.index === row ? next.label : null}
                onPress={() => router.push(examOverviewHref(exam.examId))}
              />
            ))}
          </DividedList>

          {syllabus.objectives.length > 0 && (
            <View testID="exam-subject-objectives" style={{ gap: theme.spacing.lg }}>
              <Text accessibilityRole="header" style={kicker}>
                You&apos;ll be able to
              </Text>
              {syllabus.objectives.map((group) => (
                <View key={group.examId} style={{ gap: theme.spacing.sm }}>
                  <Text style={[theme.typography.label, { color: theme.colors.textInactive }]}>
                    {`${group.level} · ${group.title}`}
                  </Text>
                  {group.items.map((item) => (
                    <View key={item} style={[styles.objective, { gap: theme.spacing.sm }]}>
                      <Check
                        size={OBJECTIVE_ICON}
                        color={theme.colors.text}
                        strokeWidth={theme.icon.strokeWidth}
                      />
                      <Text
                        style={[theme.typography.body, styles.grow, { color: theme.colors.text }]}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {syllabus.readings.length > 0 && (
            <View style={{ gap: theme.spacing.sm }}>
              <Text accessibilityRole="header" style={kicker}>
                Reading list
              </Text>
              <PassageList
                testID="exam-subject-readings"
                rowTestID="exam-subject-reading"
                passages={syllabus.readings}
                onOpen={(passage) => void openPassageLink(passage.url)}
              />
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={[styles.inset, styles.fill]}>
          <ExamUnavailable
            testID="exam-subject-unavailable"
            message="This subject isn't available."
            actionLabel="Back to exams"
            onAction={() => router.back()}
          />
        </View>
      )}
    </Screen>
  );
}

const OBJECTIVE_ICON = 16;

const styles = StyleSheet.create({
  objective: { flexDirection: "row", alignItems: "flex-start", paddingTop: 2 },
  grow: { flex: 1 },
  inset: { paddingHorizontal: PAGE_INSET },
  fill: { flex: 1 },
});
