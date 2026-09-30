import { StyleSheet, Text, View } from "react-native";

import { DividedList } from "@/ui/DividedList";
import { useTheme } from "@/theme";

export type ExamPrefaceProps = {
  /** "Exam Mode", "Study Mode · Practice". */
  kicker: string;
  title: string;
  /** The conditions it's sat under, a line each. */
  lines: readonly string[];
  testID: string;
};

/**
 * What a fresh attempt sets out before its first question, like the front
 * of an exam paper: its mode, its title, and the conditions it's sat under.
 * Its Start is the screen's to float.
 */
export function ExamPreface({ kicker, title, lines, testID }: ExamPrefaceProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={{ gap: theme.spacing.xl }}>
      <View style={{ gap: theme.spacing.sm }}>
        <Text style={[theme.typography.kicker, { color: theme.colors.textMuted }]}>{kicker}</Text>
        <Text
          accessibilityRole="header"
          style={[theme.typography.editorialDisplay, { color: theme.colors.text }]}
        >
          {title}
        </Text>
      </View>
      <DividedList>
        {lines.map((line) => (
          <Text
            key={line}
            style={[theme.typography.body, styles.line, { color: theme.colors.text }]}
          >
            {line}
          </Text>
        ))}
      </DividedList>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { paddingVertical: 14 },
});
