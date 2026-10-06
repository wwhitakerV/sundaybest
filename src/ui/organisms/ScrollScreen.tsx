import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { SCROLL_INSET, ScrollFrame, useFrameClearance, type ScrollFrameProps } from "./ScrollFrame";

type ScrollOptions = {
  /** Layout extras for the scroll's content (room at its foot). Never its sides. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Taps on a button while the keyboard's up go to the button. */
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  /** The keyboard lifts what it would cover (answer boxes). */
  automaticallyAdjustKeyboardInsets?: boolean;
};

export type ScrollScreenProps = Omit<ScrollFrameProps, "children"> &
  ScrollOptions & {
    /** What scrolls. */
    children: ReactNode;
  };

/**
 * A page that scrolls under a floating header and dock, built as iOS's are:
 * the scroll view runs the screen's full width and height — so whatever
 * springs, glows or casts a shadow near its sides is never clipped, and what
 * scrolls dissolves under both ends — and the page inset (`PAGE_INSET`) sits
 * inside it, on its content and on the header, so they line up
 * (`ScrollFrame`). A screen passes its parts, never their spacing. A long
 * list of items: `ListScreen`.
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
      <ClearedScroll
        testID={frame.testID}
        {...(contentStyle && { contentStyle })}
        {...(keyboardShouldPersistTaps && { keyboardShouldPersistTaps })}
        {...(automaticallyAdjustKeyboardInsets && { automaticallyAdjustKeyboardInsets })}
      >
        {children}
      </ClearedScroll>
    </ScrollFrame>
  );
}

/** The scroll itself, its content resting clear of the frame's header, dock, and fades. */
function ClearedScroll({
  testID,
  children,
  contentStyle,
  keyboardShouldPersistTaps,
  automaticallyAdjustKeyboardInsets,
}: ScrollOptions & { testID: string; children: ReactNode }) {
  const clearance = useFrameClearance();

  return (
    <ScrollView
      testID={`${testID}-scroll`}
      style={styles.scroll}
      contentContainerStyle={[SCROLL_INSET, contentStyle]}
      showsVerticalScrollIndicator={false}
      {...(keyboardShouldPersistTaps && { keyboardShouldPersistTaps })}
      {...(automaticallyAdjustKeyboardInsets && { automaticallyAdjustKeyboardInsets })}
    >
      <View testID={`${testID}-top-clearance`} style={{ height: clearance.top }} />
      {children}
      <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});
