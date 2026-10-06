import { StyleSheet, View } from "react-native";

import { BottomFade } from "@/ui/atoms/BottomFade";
import { FLOATING_NAV_BAR, getFloatingNavBarTintHeight } from "./floatingNavBar";

export type DockTintProps = {
  /** How far the bar's pill sits above the screen's bottom edge (`getFloatingNavBarBottom`). */
  capsuleBottom: number;
  testID?: string;
};

/**
 * The page's fade behind a floating bar — the tab bar's, every other bar's
 * and the dock's alike: edge to edge, from the screen's bottom edge to a
 * little above the pill, solid only below the pill, so what scrolls under it
 * dissolves through the bar rather than stopping at a line.
 *
 * Place it first inside the bar's own box (in from the sides by
 * `sideMargin`, its bottom at the pill's bottom); it reaches out from there.
 */
export function DockTint({ capsuleBottom, testID }: DockTintProps) {
  const height = getFloatingNavBarTintHeight(capsuleBottom);

  return (
    <View
      {...(testID && { testID })}
      pointerEvents="none"
      style={[styles.tint, { bottom: -capsuleBottom, height }]}
    >
      <BottomFade height={height} solidHeight={capsuleBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  tint: {
    position: "absolute",
    left: -FLOATING_NAV_BAR.sideMargin,
    right: -FLOATING_NAV_BAR.sideMargin,
  },
});
