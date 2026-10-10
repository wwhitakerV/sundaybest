import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";

/** The dot by a marked label: the grid's key's. */
const MARK = 10;

export type PartLabelProps = {
  children: string;
  /** Marked as the grid marks it: green for what's right, amber for what was missed — a dot and the label in it. */
  mark?: "correct" | "incorrect";
};

/** A module part's label, in the tracked caps — dark, or marked with a dot in its colour. */
export function PartLabel({ children, mark }: PartLabelProps) {
  const theme = useTheme();
  const label = (
    <MonoLabel variant="labelTrackedStrong" {...(mark && { tone: mark })} style={styles.caps}>
      {children}
    </MonoLabel>
  );
  if (!mark) return label;

  return (
    <View style={[styles.marked, { gap: space[6] }]}>
      <View
        style={[
          styles.dot,
          {
            borderRadius: radius.pill,
            backgroundColor: mark === "correct" ? theme.colors.correct : theme.colors.incorrect,
          },
        ]}
      />
      {label}
    </View>
  );
}

const styles = StyleSheet.create({
  caps: { textTransform: "uppercase" },
  marked: { flexDirection: "row", alignItems: "center" },
  dot: { width: MARK, height: MARK },
});
