import { Text, View } from "react-native";

import type { ExamMode } from "@/types/domain";
import { MeterLine } from "@/ui/MeterLine";
import { useTheme } from "@/theme";

export type ExamProgressProps = {
  done: number;
  total: number;
  mode: ExamMode;
};

/** How far through an attempt: answered (Exam) or checked (Study), in words and a still line. No score. */
export function ExamProgress({ done, total, mode }: ExamProgressProps) {
  const theme = useTheme();
  const summary = `${done} of ${total} ${mode === "study" ? "checked" : "answered"}`;

  return (
    <View testID="exam-progress" style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.metaBody, { color: theme.colors.textMuted }]}>{summary}</Text>
      <MeterLine value={done} total={total} accessibilityLabel={summary} />
    </View>
  );
}
