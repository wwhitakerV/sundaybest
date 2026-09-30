import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { DividedList } from "@/ui/DividedList";
import { SheetLayout } from "@/ui/SheetLayout";
import { useTheme } from "@/theme";
import { SUBJECTS } from "../data/catalog";
import { formatSubjectNumber } from "../logic/catalog";
import { theologyExamsSubjectHref } from "../logic/routes";

const CHEVRON = 20;
const MIN_ROW_HEIGHT = 56;

/**
 * Every subject, in a half-height sheet over the exams page: a row each, its
 * number in the mono and its name. Picking one closes the sheet with the
 * exams page open on it.
 */
export function ExamSubjectsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SheetLayout testID="exam-subjects-sheet" title="All subjects">
      <DividedList>
        {SUBJECTS.map((subject, index) => (
          <Pressable
            key={subject.id}
            testID={`exam-subjects-${subject.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${formatSubjectNumber(index)}: ${subject.title}`}
            accessibilityHint="Opens this subject"
            onPress={() => router.dismissTo(theologyExamsSubjectHref(subject.id))}
            style={[styles.row, { gap: theme.spacing.md, paddingVertical: theme.spacing.sm }]}
          >
            <Text style={[theme.typography.metaLabel, { color: theme.colors.textMuted }]}>
              {formatSubjectNumber(index)}
            </Text>
            <Text style={[theme.typography.listItem, styles.title, { color: theme.colors.text }]}>
              {subject.title}
            </Text>
            <ChevronRight
              size={CHEVRON}
              color={theme.colors.textMuted}
              strokeWidth={theme.icon.strokeWidth}
            />
          </Pressable>
        ))}
      </DividedList>
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  title: { flex: 1 },
});
