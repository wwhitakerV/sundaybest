import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { radius, space, useTheme } from "@/theme";
import { usePickPop } from "../../hooks/use-tap-feedback";
import { getPlanEndsLine } from "@/entities/plan";
import { getPlanScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

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
      <SFProTitle variant="headlineRegular">{day}</SFProTitle>
    </Animated.View>
  );
}

/**
 * "How many days?": the day chips and when the plan would end. As its scene
 * plays, a day is picked.
 */
export function DayPicker({ elapsedMs }: LiftPieceProps) {
  const { selectedDay } = getPlanScene(elapsedMs);

  return (
    <View style={styles.picker}>
      <View style={styles.chips}>
        {DAYS.map((day) => (
          <DayChip key={day} day={day} selected={selectedDay === day} />
        ))}
      </View>
      <MonoBody variant="supporting" tone="textMuted">
        {getPlanEndsLine(selectedDay)}
      </MonoBody>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { gap: space[12] },
  chips: { flexDirection: "row", justifyContent: "space-between" },
  chip: {
    width: CHIP_WIDTH,
    height: CHIP_WIDTH * 1.3,
    borderRadius: radius[14],
    alignItems: "center",
    justifyContent: "center",
  },
});
