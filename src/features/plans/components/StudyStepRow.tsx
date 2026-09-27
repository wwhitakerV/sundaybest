import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronRight, Lock, type LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import type { DayStepLook } from "../logic/day-rail";

const ROW_HEIGHT = 64;
const ICON_SQUARE = 40;
const ICON_SIZE = 20;
const LOCK_SIZE = 16;
const CHECK_SIZE = 18;
const CHECK_STROKE = 2.5;
const CHEVRON_SIZE = 16;
const CHEVRON_STROKE = 1.75;
/** The next step's edge, in its own colour. */
const CURRENT_EDGE = 1.5;
/** How a step answers a press: a soft dim and the slightest give. */
const PRESSED = { opacity: 0.7, transform: [{ scale: 0.985 }] };

export type StudyStepRowProps = {
  look: DayStepLook;
  icon: LucideIcon;
  /** The step's own colour, and a soft tint of it (`theme.colors.step*`). */
  colour: string;
  tint: string;
  /** Whether it sits on a white row of its own — the day the plan's on — or straight on the panel. */
  raised: boolean;
  onPress: () => void;
  testID: string;
};

/**
 * One step of a day, as a row to tap: a rounded square in the step's own
 * colour with its icon, its name over what it holds, and where it stands at
 * the right. Done, the square fills with the colour and the step's ticked;
 * next, the row's edged in the colour and tagged "Next"; still to come, the
 * square's tinted and a quiet chevron leads in. A step not open yet waits,
 * with no way in; a locked day's shows a lock in place of its icon, muted.
 */
export function StudyStepRow({
  look,
  icon: Icon,
  colour,
  tint,
  raised,
  onPress,
  testID,
}: StudyStepRowProps) {
  const theme = useTheme();
  const { status } = look;
  const locked = status === "locked";
  const opens = status !== "locked" && status !== "waiting";
  const square = locked ? theme.colors.surface : status === "done" ? colour : tint;
  const title = locked
    ? theme.colors.textMuted
    : status === "upcoming" || status === "waiting"
      ? theme.colors.textInactive
      : theme.colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={look.accessibilityLabel}
      accessibilityHint={opens ? "Opens it" : undefined}
      disabled={!opens}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: raised ? theme.colors.background : "transparent",
          borderColor: status === "current" ? colour : "transparent",
          borderRadius: theme.radii.lg,
        },
        pressed && PRESSED,
      ]}
    >
      <View
        testID={`${testID}-icon`}
        style={[styles.square, { backgroundColor: square, borderRadius: theme.radii.md }]}
      >
        {locked ? (
          // Lucide keeps its own testID from React Native, so this carries it.
          <View testID={`${testID}-lock`}>
            <Lock
              size={LOCK_SIZE}
              color={theme.colors.textMuted}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
        ) : (
          <Icon
            size={ICON_SIZE}
            color={status === "done" ? theme.colors.background : colour}
            strokeWidth={theme.icon.strokeWidth}
          />
        )}
      </View>

      <View style={styles.words}>
        <Text style={[theme.typography.stepTitle, { color: title }]}>{look.label}</Text>
        {look.detail && (
          <Text
            numberOfLines={1}
            style={[theme.typography.stepDetail, { color: theme.colors.textMuted }]}
          >
            {look.detail}
          </Text>
        )}
      </View>

      {status === "done" && (
        <View testID={`${testID}-done`}>
          <Check size={CHECK_SIZE} color={colour} strokeWidth={CHECK_STROKE} />
        </View>
      )}
      {status === "current" && (
        <View
          testID={`${testID}-next`}
          style={[styles.next, { backgroundColor: colour, borderRadius: theme.radii.pill }]}
        >
          <Text
            style={[
              theme.typography.metaEmphasis,
              styles.nextLabel,
              { color: theme.colors.background },
            ]}
          >
            Next
          </Text>
        </View>
      )}
      {status === "upcoming" && (
        <View testID={`${testID}-chevron`}>
          <ChevronRight
            size={CHEVRON_SIZE}
            color={theme.colors.lightIcon}
            strokeWidth={CHEVRON_STROKE}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: CURRENT_EDGE,
  },
  square: {
    width: ICON_SQUARE,
    height: ICON_SQUARE,
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1, gap: 1 },
  next: { paddingHorizontal: 10, paddingVertical: 4 },
  nextLabel: { textTransform: "uppercase", letterSpacing: 0.8 },
});
