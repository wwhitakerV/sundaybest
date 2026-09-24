import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { useTheme } from "@/theme";
import type { StageRow } from "../logic/preparing-stages";

const MARK_SIZE = 28;

export type PreparingStagesProps = {
  rows: StageRow[];
  testID: string;
};

/** Preparing's checklist: a check for each stage done, a spinner on the current one. */
export function PreparingStages({ rows, testID }: PreparingStagesProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      {rows.map(({ key, label, state }, index) => (
        <View
          key={key}
          testID={`${testID}-${key}`}
          accessibilityState={{ busy: state === "active", checked: state === "done" }}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.divider },
          ]}
        >
          <View style={styles.mark}>
            {state === "done" && (
              <Check size={20} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
            )}
            {state === "active" && <ActivityIndicator color={theme.colors.textMuted} />}
            {state === "pending" && (
              <View style={[styles.pending, { borderColor: theme.colors.divider }]} />
            )}
          </View>
          <Text
            style={[
              theme.typography.body,
              { color: state === "pending" ? theme.colors.textMuted : theme.colors.text },
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: "stretch", borderWidth: 1, borderRadius: 28, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  mark: { width: MARK_SIZE, height: MARK_SIZE, alignItems: "center", justifyContent: "center" },
  pending: { width: MARK_SIZE, height: MARK_SIZE, borderRadius: MARK_SIZE / 2, borderWidth: 2 },
});
