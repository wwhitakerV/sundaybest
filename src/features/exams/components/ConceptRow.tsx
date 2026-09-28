import { StyleSheet, Text, View } from "react-native";

import type { ExamConceptLabel } from "@/types/domain";
import { useTheme } from "@/theme";
import { formatConceptLabel } from "../logic/labels";

export type ConceptRowProps = {
  title: string;
  correct: number;
  total: number;
  label: ExamConceptLabel;
  testID: string;
};

/** A concept on the results: its name, right out of total, and its evidence label. */
export function ConceptRow({ title, correct, total, label, testID }: ConceptRowProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[styles.row, { gap: theme.spacing.md, paddingVertical: theme.spacing.sm }]}
    >
      <Text style={[theme.typography.body, styles.grow, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={styles.end}>
        <Text
          style={[theme.typography.metaLabel, { color: theme.colors.text }]}
        >{`${correct} of ${total}`}</Text>
        <Text style={[theme.typography.metaBody, { color: theme.colors.textMuted }]}>
          {formatConceptLabel(label)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
  end: { alignItems: "flex-end" },
});
