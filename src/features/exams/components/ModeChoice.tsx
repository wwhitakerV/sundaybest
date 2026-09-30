import { StyleSheet, Text, View } from "react-native";
import { ClipboardCheck, Lightbulb } from "lucide-react-native";

import type { ExamMode } from "@/types/domain";
import { useTheme } from "@/theme";
import { ModeCard } from "./ModeCard";

/** Each way in, in plain words — Study first, the gentler way in. */
const MODES = [
  {
    mode: "study",
    icon: Lightbulb,
    title: "Study",
    line: "Learn after each answer.",
    detail: "Check each answer as you go, and learn why it's right.",
  },
  {
    mode: "exam",
    icon: ClipboardCheck,
    title: "Exam",
    line: "See answers after you submit.",
    detail: "Answer every question, then submit. Scored.",
  },
] as const;

export type ModeChoiceProps = {
  selected: ExamMode;
  onSelect: (mode: ExamMode) => void;
  testID: string;
};

/**
 * The two ways to take an exam, side by side — Study, then Exam — one
 * picked (`{testID}-study`, `{testID}-exam`), and under them, what the picked one is like
 * (`{testID}-description`).
 */
export function ModeChoice({ selected, onSelect, testID }: ModeChoiceProps) {
  const theme = useTheme();
  const picked = MODES.find(({ mode }) => mode === selected) ?? MODES[0];

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View
        testID={`${testID}-options`}
        accessibilityRole="radiogroup"
        style={[styles.options, { gap: theme.spacing.sm }]}
      >
        {MODES.map(({ mode, ...copy }) => (
          <ModeCard
            key={mode}
            testID={`${testID}-${mode}`}
            {...copy}
            selected={selected === mode}
            onSelect={() => onSelect(mode)}
          />
        ))}
      </View>
      <View testID={`${testID}-description`} style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{picked.line}</Text>
        <Text style={[theme.typography.cardDetail, { color: theme.colors.textMuted }]}>
          {picked.detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row" },
});
