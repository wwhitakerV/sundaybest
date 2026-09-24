import { StyleSheet, View } from "react-native";

import { CreateButton } from "./CreateButton";
import { DayPicker } from "./DayPicker";
import type { LiftPieceProps } from "./lift-piece";

/**
 * The end of New Plan's second step, lifted as one: the day chips, then
 * "Create my plan" below them. As its scene plays, a day is picked, then the
 * button is pressed.
 */
export function PlanSetup({ elapsedMs }: LiftPieceProps) {
  return (
    <View style={styles.setup}>
      <DayPicker elapsedMs={elapsedMs} />
      <CreateButton elapsedMs={elapsedMs} />
    </View>
  );
}

const styles = StyleSheet.create({
  // A clear step down from the days to the action.
  setup: { gap: 28 },
});
