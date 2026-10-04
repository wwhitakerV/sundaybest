import type { ReactNode } from "react";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { SCROLL_INSET, ScrollFrame, type ScrollFrameProps } from "./ScrollFrame";

export type ScrollScreenProps = Omit<ScrollFrameProps, "children"> & {
  /** What scrolls. */
  children: ReactNode;
  /** Layout extras for the scroll's content (room at its foot). Never its sides. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Taps on a button while the keyboard's up go to the button. */
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  /** The keyboard lifts what it would cover (answer boxes). */
  automaticallyAdjustKeyboardInsets?: boolean;
};

/**
 * A page that scrolls between a pinned header and footer, built as iOS's
 * are: the scroll view runs the screen's full width — so whatever springs,
 * glows or casts a shadow near its sides is never clipped short of the screen
 * edge — and the page inset (`PAGE_INSET`) sits inside it, on its content,
 * and on the header and the footer, so all three line up (`ScrollFrame`). A
 * screen passes its parts, never their sides' spacing. A long list of items:
 * `ListScreen`.
 */
export function ScrollScreen({
  children,
  contentStyle,
  keyboardShouldPersistTaps,
  automaticallyAdjustKeyboardInsets,
  ...frame
}: ScrollScreenProps) {
  return (
    <ScrollFrame {...frame}>
      <ScrollView
        testID={`${frame.testID}-scroll`}
        style={styles.scroll}
        contentContainerStyle={[SCROLL_INSET, contentStyle]}
        showsVerticalScrollIndicator={false}
        {...(keyboardShouldPersistTaps && { keyboardShouldPersistTaps })}
        {...(automaticallyAdjustKeyboardInsets && { automaticallyAdjustKeyboardInsets })}
      >
        {children}
      </ScrollView>
    </ScrollFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});
