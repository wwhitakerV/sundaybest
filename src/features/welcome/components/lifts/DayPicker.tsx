import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import { usePickPop } from "../../hooks/use-tap-feedback";
import { getPlanEndsLine, getPlanScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const CHIP_WIDTH = 44;
const SELECTED_BORDER = 2.5;

function DayChip({ day, selected }: { day: number; selected: boolean }) {
  const theme = useTheme();
  const popStyle = usePickPop(selected);

  return (
    // The chip and its border move as one: picking it pops the whole pill.
    <Animated.View
      style={[
        styles.chip,
        selected
          ? { borderColor: theme.colors.text, borderWidth: SELECTED_BORDER }
          : { borderColor: theme.colors.divider, borderWidth: 1 },
        popStyle,
      ]}
    >
      <Text style={[theme.typography.headline, styles.day, { color: theme.colors.text }]}>
        {day}
      </Text>
    </Animated.View>
  );
}

/**
 * "How many days?": the day chips and when the plan would end. As its scene
 * plays, a day is picked.
 */
export function DayPicker({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { selectedDay } = getPlanScene(elapsedMs);

  return (
    <View style={styles.picker}>
      <View style={styles.chips}>
        {DAYS.map((day) => (
          <DayChip key={day} day={day} selected={selectedDay === day} />
        ))}
      </View>
      <Text style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
        {getPlanEndsLine(selectedDay)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { gap: 12 },
  chips: { flexDirection: "row", justifyContent: "space-between" },
  chip: {
    width: CHIP_WIDTH,
    height: CHIP_WIDTH * 1.3,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { fontWeight: "400" },
});
