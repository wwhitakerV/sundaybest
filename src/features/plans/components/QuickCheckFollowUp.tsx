import { Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronRight, ListChecks, Lock } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import type { QuickCheckLook } from "../logic/day-rail";
import {
  STEP_CHECK_STROKE,
  STEP_MARK_GAP,
  STEP_NODE_SIZE,
  STEP_ROW_INSET,
} from "../logic/step-sequence";
import { SFProBody } from "@/ui/typography/SFProBody";
import { toneColor, type Tone } from "@/ui/typography/tone";

const ICON_SIZE = 20;
const LOCK_SIZE = 16;
const MARK_SIZE = 18;
const ROW_PADDING = space[14];
/** How it answers a press: a soft dim. */
const PRESSED = { opacity: 0.7 };

export type QuickCheckFollowUpProps = {
  look: QuickCheckLook;
  onPress: () => void;
  testID: string;
};

/**
 * A day's Quick Check, as what follows its study rather than a step of it:
 * one plain line — its icon, its name, and where it stands at the right —
 * lined up with the steps above but without a mark on their line. It waits,
 * muted, until the study's done; then a quiet chevron leads in. Taken, it's
 * ticked, with how it went. Never red: it's there when you want it.
 */
export function QuickCheckFollowUp({ look, onPress, testID }: QuickCheckFollowUpProps) {
  const theme = useTheme();
  const { status, opens } = look;
  const done = status === "done";
  const tone: Tone = status === "current" ? "text" : "textMuted";
  const ink = toneColor(theme.colors, tone);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={look.accessibilityLabel}
      accessibilityHint={opens ? "Opens it" : undefined}
      disabled={!opens}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && PRESSED]}
    >
      {/* Lucide keeps its own testID from React Native, so these carry it. */}
      <View style={styles.icon}>
        {status === "locked" ? (
          <View testID={`${testID}-lock`}>
            <Lock size={LOCK_SIZE} color={ink} strokeWidth={theme.icon.strokeWidth} />
          </View>
        ) : (
          <ListChecks size={ICON_SIZE} color={ink} strokeWidth={theme.icon.strokeWidth} />
        )}
      </View>
      <SFProBody variant="listItem" tone={tone} style={styles.name}>
        {look.label}
      </SFProBody>
      {/* Where it stands, and its mark, kept together at the right. */}
      <View style={styles.standing}>
        {look.detail && (
          <SFProBody variant="detail" tone="textMuted">
            {look.detail}
          </SFProBody>
        )}
        {done && (
          <View testID={`${testID}-done`}>
            <Check
              size={MARK_SIZE}
              color={theme.colors.textMuted}
              strokeWidth={STEP_CHECK_STROKE}
            />
          </View>
        )}
        {opens && !done && (
          <View testID={`${testID}-chevron`}>
            <ChevronRight
              size={MARK_SIZE}
              color={theme.colors.textMuted}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Inset as the steps' rows are, so its icon sits on their marks' column.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: STEP_MARK_GAP,
    paddingHorizontal: STEP_ROW_INSET,
    paddingVertical: ROW_PADDING,
  },
  icon: { width: STEP_NODE_SIZE, alignItems: "center" },
  name: { flex: 1 },
  standing: { flexDirection: "row", alignItems: "center", gap: space[6] },
});
