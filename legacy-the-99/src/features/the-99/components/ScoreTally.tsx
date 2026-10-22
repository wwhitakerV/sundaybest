import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";

export type ScoreTallyProps = {
  saved: number;
  left: number;
  lost: number;
};

/** One count: its number in Canela over its name in the tracked label. */
function Count({
  label,
  value,
  tone,
  testID,
}: {
  label: string;
  value: number;
  tone: "accent" | "text" | "textSupporting";
  testID: string;
}) {
  return (
    <View testID={testID} accessible accessibilityLabel={`${label} ${value}`} style={styles.count}>
      <SerifTitle variant="feature" tone={tone}>
        {String(value)}
      </SerifTitle>
      <MonoLabel variant="labelTracked" tone="textSupporting">
        {label}
      </MonoLabel>
    </View>
  );
}

/**
 * The game's score, over the board: the saved in red at the left, those
 * still in the field in the middle, the lost at the right — what's left to
 * play for at a glance.
 */
export function ScoreTally({ saved, left, lost }: ScoreTallyProps) {
  return (
    <View style={styles.tally}>
      <Count testID="the-99-saved" label="SAVED" value={saved} tone="accent" />
      <Count testID="the-99-left" label="IN THE FIELD" value={left} tone="text" />
      <Count testID="the-99-lost" label="LOST" value={lost} tone="textSupporting" />
    </View>
  );
}

const styles = StyleSheet.create({
  tally: { flexDirection: "row", justifyContent: "space-between" },
  count: { flex: 1, alignItems: "center", gap: space[2] },
});
