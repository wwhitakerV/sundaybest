import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { DockTint } from "./DockTint";
import { FLOATING_NAV_BAR, getFloatingNavBarBottom } from "./floatingNavBar";

const { capsuleHeight, sideMargin } = FLOATING_NAV_BAR;

export type FloatingDockProps = {
  /** What it holds: a screen's one `Button`, or a bar's own pill (Study's pager). */
  children: ReactNode;
  testID: string;
};

/**
 * A page's way on, in the one container every bar in the app shares: where
 * the tab bar's pill sits, as tall, as far in from the sides, on the same
 * tint. A Done, a Check, a Continue — or Study's pager — are just different
 * things in it. Place it last in a full-height frame (`ScrollFrame`), whose
 * bottom is the screen's.
 */
export function FloatingDock({ children, testID }: FloatingDockProps) {
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const capsuleBottom = getFloatingNavBarBottom(insetBottom);

  return (
    <View testID={testID} pointerEvents="box-none" style={[styles.dock, { bottom: capsuleBottom }]}>
      <DockTint testID={`${testID}-tint`} capsuleBottom={capsuleBottom} />
      <View testID={`${testID}-row`} style={styles.row}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: "absolute", left: sideMargin, right: sideMargin },
  row: { height: capsuleHeight, justifyContent: "center" },
});
