import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { BottomFade } from "./BottomFade";
import {
  FLOATING_NAV_BAR,
  getFloatingNavBarBottom,
  getFloatingNavBarTintHeight,
} from "./floatingNavBar";

const { capsuleHeight, sideMargin } = FLOATING_NAV_BAR;

export type FloatingBarProps = {
  /** What it holds, in a row: a screen's `FloatingButton`s. */
  children: ReactNode;
  testID: string;
};

/**
 * A screen's own floating bar, in the one place every bar in the app floats
 * — the tab bar, the study pager — with the page's fade behind it, edge to
 * edge and down to the screen's edge, so what scrolls under it dissolves
 * rather than showing through. Place it last inside a `Screen` (whose
 * content ends at the safe area's edge), and leave its content
 * `getFloatingNavBarClearance` at the foot to scroll clear of it.
 */
export function FloatingBar({ children, testID }: FloatingBarProps) {
  const theme = useTheme();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const capsuleBottom = getFloatingNavBarBottom(insetBottom);
  const tintHeight = getFloatingNavBarTintHeight(capsuleBottom);

  return (
    <View
      testID={testID}
      pointerEvents="box-none"
      style={[styles.bar, { bottom: capsuleBottom - insetBottom }]}
    >
      <View
        pointerEvents="none"
        style={[styles.tint, { bottom: -capsuleBottom, height: tintHeight }]}
      >
        <BottomFade testID={`${testID}-tint`} height={tintHeight} solidHeight={capsuleBottom} />
      </View>
      <View testID={`${testID}-row`} style={[styles.row, { gap: theme.spacing.sm }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", left: sideMargin, right: sideMargin },
  tint: { position: "absolute", left: -sideMargin, right: -sideMargin },
  row: { height: capsuleHeight, flexDirection: "row", alignItems: "center" },
});
