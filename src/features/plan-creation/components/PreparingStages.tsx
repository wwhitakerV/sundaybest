import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import type { StageRow } from "../logic/preparing-stages";
import { SFProBody } from "@/ui/typography/SFProBody";

const MARK_SIZE = 28;

export type PreparingStagesProps = {
  rows: StageRow[];
  testID: string;
};

/** Preparing's checklist: a check for each stage done, a spinner on the current one. */
export function PreparingStages({ rows, testID }: PreparingStagesProps) {
  const theme = useTheme();

  return (
    <Card testID={testID} style={styles.card}>
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
          <SFProBody tone={state === "pending" ? "textMuted" : "text"}>{label}</SFProBody>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: "stretch", overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[16],
    paddingHorizontal: space[20],
    paddingVertical: space[18],
  },
  mark: { width: MARK_SIZE, height: MARK_SIZE, alignItems: "center", justifyContent: "center" },
  pending: { width: MARK_SIZE, height: MARK_SIZE, borderRadius: MARK_SIZE / 2, borderWidth: 2 },
});
