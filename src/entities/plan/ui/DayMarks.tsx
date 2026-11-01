import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";

export type DayMarksProps = {
  /** How many days the plan runs. */
  total: number;
  /** How many of them are done. */
  done: number;
  /** The day it's on, in the accent ("this one, now"); none for a plan finished, or on a shelf. */
  current?: number | null;
  /** Led by "DAY", so the numerals can't be read as anything else (a plan featured). */
  labelled?: boolean;
  testID?: string;
};

/**
 * How far a plan's come, as a contents page would set it: its days as
 * numerals in a row, `1 2 3 4 5 6 7`, the days done in ink, the day it's
 * on in the accent, and the rest faint — which days, not just how much.
 */
export function DayMarks({ total, done, current = null, labelled = false, testID }: DayMarksProps) {
  const now = current === null ? "" : `, on day ${current}`;
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${done} of ${total} days done${now}`}
      style={styles.row}
    >
      {labelled && (
        <MonoLabel variant="labelTracked" tone="textMuted" style={styles.label}>
          DAY
        </MonoLabel>
      )}
      {Array.from({ length: total }, (_, index) => {
        const day = index + 1;
        const tone = day === current ? "accent" : index < done ? "text" : "textMuted";
        return (
          <MonoLabel key={day} variant="labelTracked" tone={tone}>
            {String(day)}
          </MonoLabel>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[8] },
  // A beat more room after the label than between the days, so it reads as their name.
  label: { marginRight: space[4] },
});
