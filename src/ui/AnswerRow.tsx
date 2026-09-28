import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, CircleDashed, X } from "lucide-react-native";

import { useTheme, type Theme } from "@/theme";

const MIN_HEIGHT = 56;
const MARKER_SIZE = 24;
const MARKER_ICON_SIZE = 16;
/** The selected outline's weight — drawn over the 1pt edge, never in layout. */
const SELECTED_OUTLINE = 2;
/** Once an answer's revealed, the rows it doesn't concern step back. */
const FADED_OPACITY = 0.45;

/**
 * The mark at the row's start, and what it says about the question: a
 * circle for one answer, a square for several, a number for a place in order.
 */
export type AnswerMarker =
  { shape: "radio" } | { shape: "checkbox" } | { shape: "number"; number: number | null };

/**
 * - `idle` / `selected` — before any reveal.
 * - `correct`, `incorrect`, `missed` — revealed: a right answer, a wrong pick,
 *   a right answer not picked.
 * - `faded` — revealed, and none of those.
 */
export type AnswerRowState = "idle" | "selected" | "correct" | "incorrect" | "missed" | "faded";

export type AnswerRowProps = {
  label: string;
  marker: AnswerMarker;
  state: AnswerRowState;
  /** A short word on the row's state — "Answer saved", "Correct answer", "Missed". */
  status?: string;
  /** A line under it — a rationale, once revealed. */
  detail?: string;
  /** Absent, the row can't be pressed: it's locked, or revealed. */
  onPress?: () => void;
  /** Once revealed, whether this was the user's answer — still reported as selected. */
  picked?: boolean;
  accessibilityLabel: string;
  accessibilityRole?: "radio" | "checkbox" | "button";
  testID: string;
};

function markerStyle(marker: AnswerMarker, state: AnswerRowState, theme: Theme) {
  const filled = state === "selected" || (marker.shape === "number" && marker.number !== null);
  return {
    borderRadius: marker.shape === "checkbox" ? theme.radii.sm : theme.radii.pill,
    borderColor: filled ? theme.colors.accent : theme.colors.border,
    backgroundColor: filled ? theme.colors.accent : "transparent",
  };
}

function RevealMark({ state, theme }: { state: AnswerRowState; theme: Theme }) {
  const stroke = theme.icon.strokeWidth;
  if (state === "correct") {
    return <Check size={MARKER_SIZE} color={theme.colors.correct} strokeWidth={stroke} />;
  }
  if (state === "incorrect") {
    return <X size={MARKER_SIZE} color={theme.colors.feedbackIncorrect} strokeWidth={stroke} />;
  }
  return <CircleDashed size={MARKER_SIZE} color={theme.colors.textMuted} strokeWidth={stroke} />;
}

/**
 * One answer to a question: a large, calm row with its mark, its words, and
 * — once answered or revealed — what that means, in words as well as colour.
 * Red marks only what's selected; a wrong answer is ink, with a ✕ and its
 * word. Shared by any question-and-answer screen; it knows nothing of exams.
 */
export function AnswerRow({
  label,
  marker,
  state,
  status,
  detail,
  onPress,
  picked = false,
  accessibilityLabel,
  accessibilityRole = "button",
  testID,
}: AnswerRowProps) {
  const theme = useTheme();
  const revealed = state === "correct" || state === "incorrect" || state === "missed";
  const selected = state === "selected";
  const chosen = selected || picked;
  const statusColor =
    state === "correct"
      ? theme.colors.correct
      : state === "incorrect"
        ? theme.colors.feedbackIncorrect
        : theme.colors.textMuted;

  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled: !onPress,
        ...(accessibilityRole === "checkbox" ? { checked: chosen } : { selected: chosen }),
      }}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.row,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.background,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        },
        state === "faded" && styles.faded,
      ]}
    >
      {selected && (
        <View
          pointerEvents="none"
          style={[styles.outline, { borderColor: theme.colors.text, borderRadius: theme.radii.lg }]}
        />
      )}
      <View style={styles.markerSlot}>
        {revealed ? (
          <RevealMark state={state} theme={theme} />
        ) : (
          <View style={[styles.marker, markerStyle(marker, state, theme)]}>
            {marker.shape === "number" && marker.number !== null ? (
              <Text style={[theme.typography.label, { color: theme.colors.onAccent }]}>
                {marker.number}
              </Text>
            ) : selected ? (
              <Check
                size={MARKER_ICON_SIZE}
                color={theme.colors.onAccent}
                strokeWidth={theme.icon.strokeWidth}
              />
            ) : null}
          </View>
        )}
      </View>
      <View style={[styles.words, { gap: theme.spacing.xs }]}>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{label}</Text>
        {status ? (
          <Text style={[theme.typography.metaLabel, { color: statusColor }]}>{status}</Text>
        ) : null}
        {detail ? (
          <Text style={[theme.typography.cardDetail, { color: theme.colors.textInactive }]}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_HEIGHT, borderWidth: 1, flexDirection: "row", alignItems: "flex-start" },
  outline: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: SELECTED_OUTLINE,
  },
  markerSlot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1 },
  faded: { opacity: FADED_OPACITY },
});
