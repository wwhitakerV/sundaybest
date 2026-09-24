import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { HeaderSideContext } from "./header-side";

const MIN_HEIGHT = 54;
const GAP = 12;

export type ScreenHeaderProps = {
  /** Centered title. A plain string renders with the standard `navTitle` role. */
  title: string;
  /** Left slot — typically a `HeaderIconButton` (back or close). */
  left?: ReactNode;
  /** Right slot — typically a `HeaderIconButton` or a step-count `Text`. */
  right?: ReactNode;
  testID?: string;
};

/**
 * The standard header row: left slot, centered title, right slot. No
 * border or background of its own — every screen sits directly on the
 * page background, matching the design's "no explicit header background
 * separate from screen" rule.
 *
 * Tells each slot which side it's on (`useHeaderSide`), so a button arrives
 * from its own edge.
 */
export function ScreenHeader({ title, left, right, testID }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      <View style={styles.side}>
        <HeaderSideContext.Provider value="leading">{left}</HeaderSideContext.Provider>
      </View>
      <Text
        style={[theme.typography.navTitle, styles.title, { color: theme.colors.chromeTitle }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.sideEnd]}>
        <HeaderSideContext.Provider value="trailing">{right}</HeaderSideContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GAP,
  },
  side: {
    minWidth: 49,
    alignItems: "flex-start",
  },
  sideEnd: {
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
});
