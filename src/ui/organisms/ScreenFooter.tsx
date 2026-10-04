import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { space } from "@/theme";

/**
 * The room under a pinned footer's last button, above the safe area — the
 * same on every screen, so a footer's buttons never sit higher on one than
 * another, or move when a `FeedbackPanel` takes the footer's place.
 */
export const FOOTER_BOTTOM = 0;

export type ScreenFooterProps = {
  testID: string;
  /** Its buttons, top to bottom. */
  children: ReactNode;
  /** Layout extras (the room above it). */
  style?: StyleProp<ViewStyle>;
};

/** A screen's pinned buttons at its foot, where every screen keeps them. */
export function ScreenFooter({ testID, children, style }: ScreenFooterProps) {
  return (
    <View testID={testID} style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space[12], paddingBottom: FOOTER_BOTTOM },
});
