import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

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

/** A small dot row marking position within a set — e.g. Reflect's question index. */
export function DotPagination({ count, activeIndex, variant = "dot", testID }: DotPaginationProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <View
            key={index}
            testID={testID && `${testID}-dot-${index}`}
            style={[
              styles.dot,
              {
                width: variant === "pill" && isActive ? PILL_WIDTH : DOT_SIZE,
                backgroundColor: isActive ? theme.palette.black : theme.colors.lightIcon,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: GAP },
  dot: { height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
});
