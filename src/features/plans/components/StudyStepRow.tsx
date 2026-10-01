import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import type { StudyStepLook } from "../logic/day-rail";
import { STEP_MARK_GAP, STEP_NODE_SIZE, STEP_ROW_INSET } from "../logic/step-sequence";
import { StudyStepNode } from "./StudyStepNode";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Above and below its words: room enough that each step reads as a thing to tap. */
const ROW_PADDING = space[16];
const LINE_WIDTH = 1.5;
/** Between the line and the mark it runs into. */
const LINE_GAP = space[4];
const CHEVRON_SIZE = 18;
/** How a step answers a press: a soft dim — no give, so the line it's on stays unbroken. */
const PRESSED = { opacity: 0.7 };

export type StudyStepRowProps = {
  look: StudyStepLook;
  icon: LucideIcon;
  /** Whether the line runs up to the step before it, and down to the one after. */
  joinsPrevious: boolean;
  joinsNext: boolean;
  onPress: () => void;
  testID: string;
};

/**
 * One study step of a day, a point on the line the day runs down: its mark
 * (`StudyStepNode`), its name over what it holds, and — for the step you're
 * on alone — a soft surface and a chevron leading in, so it's the one thing
 * that stands out. A done step recedes, its words muted; one still to come
 * is neutral, a step behind. A locked day's are muted, with no way in.
 */
export function StudyStepRow({
  look,
  icon,
  joinsPrevious,
  joinsNext,
  onPress,
  testID,
}: StudyStepRowProps) {
  const theme = useTheme();
  const { status } = look;
  const current = status === "current";
  const line = (joins: boolean) => ({
    backgroundColor: joins ? theme.colors.sequenceLine : "transparent",
  });

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={look.accessibilityLabel}
      accessibilityHint={look.opens ? "Opens it" : undefined}
      disabled={!look.opens}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: current ? theme.colors.surface : "transparent",
          borderRadius: radius[16],
        },
        pressed && PRESSED,
      ]}
    >
      {/* The line runs the row's full height, so it meets its neighbours'. */}
      <View style={styles.track}>
        <View
          testID={`${testID}-line-in`}
          style={[styles.line, styles.lineIn, line(joinsPrevious)]}
        />
        <StudyStepNode testID={`${testID}-node`} status={status} icon={icon} />
        <View
          testID={`${testID}-line-out`}
          style={[styles.line, styles.lineOut, line(joinsNext)]}
        />
      </View>

      <View style={styles.words}>
        <SFProTitle
          variant="step"
          tone={current ? "text" : status === "upcoming" ? "textInactive" : "textMuted"}
        >
          {look.label}
        </SFProTitle>
        {look.detail && (
          <SFProBody
            variant="detail"
            tone={current ? "textInactive" : "textMuted"}
            numberOfLines={1}
          >
            {look.detail}
          </SFProBody>
        )}
      </View>

      {current && (
        // Lucide keeps its own testID from React Native, so this carries it.
        <View testID={`${testID}-chevron`}>
          <ChevronRight
            size={CHEVRON_SIZE}
            color={theme.colors.text}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: STEP_MARK_GAP,
    paddingHorizontal: STEP_ROW_INSET,
    paddingVertical: ROW_PADDING,
  },
  // Out past the row's padding, top and bottom, to its edges.
  track: {
    width: STEP_NODE_SIZE,
    alignSelf: "stretch",
    alignItems: "center",
    marginVertical: -ROW_PADDING,
  },
  line: { flex: 1, width: LINE_WIDTH },
  lineIn: { marginBottom: LINE_GAP },
  lineOut: { marginTop: LINE_GAP },
  words: { flex: 1, gap: space[2] },
});
