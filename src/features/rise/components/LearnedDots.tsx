import { Pressable, StyleSheet, View } from "react-native";

import { RiseMark } from "@/entities/rise";
import { space } from "@/theme";
import type { LearnedRow } from "../logic/describe-rise";

/** A dot's height: a mark, small. */
const DOT_SIZE = 26;
/** How faint the dots not in view are. */
const AWAY = 0.32;
/** A dot's tap reaches past it, to 44 points tall and room either side. */
const REACH = { top: 9, bottom: 9, left: 6, right: 6 };

export type LearnedDotsProps = {
  rows: LearnedRow[];
  /** The page in view. */
  page: number;
  onPick: (page: number) => void;
};

/**
 * Where you are in the six, and how each went: a small balloon or burst for
 * each, the one in view whole, the rest faint. A tap goes to that one.
 */
export function LearnedDots({ rows, page, onPick }: LearnedDotsProps) {
  return (
    <View style={styles.row}>
      {rows.map((row, index) => (
        <Pressable
          key={row.id}
          testID={`rise-learned-dot-${index}`}
          accessibilityRole="button"
          accessibilityLabel={`Question ${index + 1}`}
          accessibilityState={{ selected: index === page }}
          hitSlop={REACH}
          onPress={() => onPick(index)}
          style={{ opacity: index === page ? 1 : AWAY }}
        >
          <RiseMark verdict={row.verdict === "right" ? "rose" : "burst"} size={DOT_SIZE} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: space[12] },
});
