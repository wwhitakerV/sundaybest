import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { PaginationDot } from "./PaginationDot";

const DOT_SIZE = 6;
const PILL_WIDTH = 20;
const GAP = 6;

export type DotPaginationProps = {
  count: number;
  activeIndex: number;
  /** "dot" (default): every dot is the same small circle. "pill": the
   * active dot widens into a pill, the rest stay small circles. */
  variant?: "dot" | "pill";
  testID?: string;
};

/**
 * A small dot row marking position within a set — e.g. the Daily Study's
 * steps. When the active dot changes, the old one springs back to a dot and
 * the new one stretches out into the pill (`PaginationDot`); the row's
 * length never changes, so nothing around it moves.
 */
export function DotPagination({ count, activeIndex, variant = "dot", testID }: DotPaginationProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        <PaginationDot
          key={index}
          {...(testID && { testID: `${testID}-dot-${index}` })}
          active={index === activeIndex}
          size={DOT_SIZE}
          activeWidth={variant === "pill" ? PILL_WIDTH : DOT_SIZE}
          color={theme.colors.lightIcon}
          activeColor={theme.palette.black}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: GAP },
});
