import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Lock } from "lucide-react-native";

import { useTheme } from "@/theme";
import type { DayTileLook } from "../logic/day-rail";

/** Every day's width — and the selected day's outline's, which the rail draws over it. */
export const DAY_TILE_WIDTH = 58;
/** …and its height. */
export const DAY_TILE_HEIGHT = 80;
const MARK_SIZE = 14;
const LOCK_SIZE = 10;
/** A finished day's check, drawn a touch firmer than the chrome's icons. */
const CHECK_STROKE = 3;
/** Between the mark and the number: room to breathe. */
const MARK_GAP = 6;
const TODAY_DOT = 6;

export type DayTileProps = {
  look: DayTileLook;
  selected: boolean;
  onPress: () => void;
  testID: string;
};

/**
 * One day of a plan, as a point on its journey rather than a box: a tiny
 * mark on top — a check once it's done, a dot of SundayBest red on the day
 * the plan's on, a lock while it's not open — then its number, large, and
 * its date small in capitals. A finished day sits on a soft off-white
 * surface; the rest have none, a locked day quieter. The day picked is
 * outlined by the rail (`DayRail`), over it.
 * Tapping picks it.
 */
export function DayTile({ look, selected, onPress, testID }: DayTileProps) {
  const theme = useTheme();
  const locked = look.mark === "locked";
  const dayComplete = look.mark === "done";
  const ink = locked ? theme.colors.textMuted : theme.colors.text;
  // A finished day's date keeps some presence — secondary, not ghosted.
  const dateInk = dayComplete ? theme.colors.textInactive : theme.colors.textMuted;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityLabel={look.accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.day,
        {
          backgroundColor: dayComplete ? theme.colors.surface : "transparent",
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      {/* Lucide keeps its own testID from React Native, so the marks carry it. */}
      <View testID={`${testID}-mark`} style={styles.mark}>
        {dayComplete && (
          <View testID={`${testID}-done`}>
            <Check size={MARK_SIZE} color={theme.colors.text} strokeWidth={CHECK_STROKE} />
          </View>
        )}
        {locked && (
          <View testID={`${testID}-locked`}>
            <Lock
              size={LOCK_SIZE}
              color={theme.colors.textMuted}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
        )}
        {look.today && (
          <View
            testID={`${testID}-today`}
            style={[
              styles.dot,
              { backgroundColor: theme.colors.accent, borderRadius: theme.radii.pill },
            ]}
          />
        )}
      </View>
      <Text style={[theme.typography.tileNumber, styles.number, { color: ink }]}>
        {look.number}
      </Text>
      {look.date && (
        <Text style={[theme.typography.tileDate, styles.date, { color: dateInk }]}>
          {look.date}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  day: {
    width: DAY_TILE_WIDTH,
    height: DAY_TILE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  mark: {
    height: MARK_SIZE,
    marginBottom: MARK_GAP,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: TODAY_DOT, height: TODAY_DOT },
  // Even-width digits, so 1 and 7 sit alike.
  number: { fontVariant: ["tabular-nums"] },
  date: { textTransform: "uppercase" },
});
