import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { getJourneyLabel, type DayTileLook } from "../logic/day-rail";
import { DayRail } from "./DayRail";

export type PlanJourneyProps = {
  totalDays: number;
  tiles: readonly DayTileLook[];
  /** The day picked's number. */
  selected: number;
  onSelect: (dayNumber: number) => void;
};

/** Plan Detail's row of days under its heading: where you are at a glance. */
export function PlanJourney({ totalDays, tiles, selected, onSelect }: PlanJourneyProps) {
  return (
    <View style={styles.journey}>
      <MonoLabel
        variant="labelTracked"
        tone="textMuted"
        style={styles.label}
        testID="plan-overview-journey"
      >
        {getJourneyLabel(totalDays)}
      </MonoLabel>
      <DayRail
        testID="plan-overview-days"
        tileTestIDPrefix="plan-overview-day"
        tiles={tiles}
        selected={selected}
        onSelect={onSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  journey: { gap: space[14] },
  label: { textTransform: "uppercase" },
});
