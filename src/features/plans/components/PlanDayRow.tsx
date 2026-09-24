import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, Check, ChevronRight, Lock } from "lucide-react-native";

import type { PlanDayStatus } from "@/types/domain";
import { useTheme } from "@/theme";

const MARK_SIZE = 52;

/** What each state's row says on its right, and whether it opens. */
const ACTION = new Map<PlanDayStatus, { label: string; opens: boolean }>([
  ["completed", { label: "Done", opens: true }],
  ["inProgress", { label: "Continue", opens: true }],
  ["available", { label: "Start", opens: true }],
  ["locked", { label: "Locked", opens: false }],
]);

export type PlanDayRowProps = {
  title: string;
  dayNumber: number;
  minutes: number;
  status: PlanDayStatus;
  onPress: () => void;
  testID: string;
};

/**
 * One day of a plan: its mark (a check once done, a book while open, a lock
 * until it opens), title, number and length, and what tapping it does.
 */
export function PlanDayRow({
  title,
  dayNumber,
  minutes,
  status,
  onPress,
  testID,
}: PlanDayRowProps) {
  const theme = useTheme();
  const action = ACTION.get(status) ?? { label: "Start", opens: true };
  const done = status === "completed";
  const locked = status === "locked";
  const Mark = done ? Check : locked ? Lock : BookOpen;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Day ${dayNumber}, ${title}, ${action.label}`}
      accessibilityState={{ disabled: !action.opens, checked: done }}
      disabled={!action.opens}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: done ? theme.colors.surface : theme.colors.background,
          borderColor: theme.colors.divider,
        },
      ]}
    >
      <View
        style={[
          styles.mark,
          {
            backgroundColor: locked ? theme.colors.segmentBackground : theme.colors.controlPrimary,
          },
        ]}
      >
        <Mark
          size={22}
          color={locked ? theme.colors.textMuted : theme.colors.onControlPrimary}
          strokeWidth={theme.icon.strokeWidth}
        />
      </View>
      <View style={styles.text}>
        <Text
          numberOfLines={1}
          style={[
            theme.typography.listItem,
            { color: locked ? theme.colors.textMuted : theme.colors.text },
          ]}
        >
          {title}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          Day {dayNumber}, {minutes} min
        </Text>
      </View>
      <View style={styles.action}>
        <Text
          style={[
            theme.typography.body,
            { color: done || locked ? theme.colors.textMuted : theme.colors.text },
          ]}
        >
          {action.label}
        </Text>
        {action.opens && !done && (
          <ChevronRight size={18} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderRadius: 32,
    padding: 16,
    paddingRight: 20,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  action: { flexDirection: "row", alignItems: "center", gap: 2 },
});
