import { StyleSheet, View } from "react-native";
import { Check, Lock, type LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import type { StudyStepLook } from "../logic/day-rail";
import { STEP_CHECK_STROKE, STEP_NODE_SIZE } from "./step-sequence";

const ICON_SIZE = 18;
const LOCK_SIZE = 15;
/** The ring of a step still to come. */
const RING = 1.5;

export type StudyStepNodeProps = {
  status: StudyStepLook["status"];
  icon: LucideIcon;
  testID: string;
};

/**
 * A step's mark on the line its day runs down — one look for every step, so
 * only where it stands tells them apart. Done, it settles to a quiet tick on
 * a soft disc; the step you're on fills in SundayBest red, its icon on it —
 * the only red in the day; still to come, it's a plain ring round its icon.
 * A locked day's steps are ringed round a lock.
 */
export function StudyStepNode({ status, icon: Icon, testID }: StudyStepNodeProps) {
  const theme = useTheme();
  const done = status === "done";
  const current = status === "current";
  const ringed = !done && !current;

  return (
    <View
      testID={testID}
      style={[
        styles.node,
        {
          backgroundColor: done
            ? theme.colors.surface
            : current
              ? theme.colors.accent
              : "transparent",
          borderColor: ringed ? theme.colors.sequenceLine : "transparent",
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      {/* Lucide keeps its own testID from React Native, so these carry it. */}
      {done && (
        <View testID={`${testID}-done`}>
          <Check size={ICON_SIZE} color={theme.colors.textMuted} strokeWidth={STEP_CHECK_STROKE} />
        </View>
      )}
      {status === "locked" && (
        <View testID={`${testID}-lock`}>
          <Lock
            size={LOCK_SIZE}
            color={theme.colors.textMuted}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      )}
      {(current || status === "upcoming") && (
        <View testID={`${testID}-icon`}>
          <Icon
            size={ICON_SIZE}
            color={current ? theme.colors.onAccent : theme.colors.textMuted}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    width: STEP_NODE_SIZE,
    height: STEP_NODE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: RING,
  },
});
