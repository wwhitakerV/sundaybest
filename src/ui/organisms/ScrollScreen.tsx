import { useRef, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useScrollToEnd } from "@/hooks/use-scroll-to-end";
import { SCROLL_INSET, ScrollFrame, useFrameClearance, type ScrollFrameProps } from "./ScrollFrame";

/** How often a scroll reports its position: once a frame. */
const SCROLL_THROTTLE_MS = 16;

type ScrollOptions = {
  /** Layout extras for the scroll's content (room at its foot). Never its sides. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Taps on a button while the keyboard's up go to the button. */
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  /** The keyboard lifts what it would cover (answer boxes). */
  automaticallyAdjustKeyboardInsets?: boolean;
  /** How far down it's scrolled, as it scrolls — for a page whose header changes with it. */
  onScroll?: (y: number) => void;
  /**
   * The page fits the screen and never scrolls (Progress): its content fills
   * the space between the frame's ends, for a part of it to take what's left.
   */
  fixed?: boolean;
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
  onScroll,
  fixed,
  ...frame
}: ScrollScreenProps) {
  return (
    <ScrollFrame {...frame}>
      <ClearedScroll
        testID={frame.testID}
        {...(contentStyle && { contentStyle })}
        {...(keyboardShouldPersistTaps && { keyboardShouldPersistTaps })}
        {...(automaticallyAdjustKeyboardInsets && { automaticallyAdjustKeyboardInsets })}
        {...(onScroll && { onScroll })}
        {...(fixed && { fixed })}
      >
        {children}
      </ClearedScroll>
    </ScrollFrame>
  );
}

/**
 * The scroll itself, its content resting clear of the frame's header, dock,
 * and fades. When a verdict comes up (`feedback`), it scrolls all the way
 * down, so the answer it's about is never left behind the panel.
 */
function ClearedScroll({
  testID,
  children,
  contentStyle,
  keyboardShouldPersistTaps,
  automaticallyAdjustKeyboardInsets,
  onScroll,
  fixed = false,
}: ScrollOptions & { testID: string; children: ReactNode }) {
  const clearance = useFrameClearance();
  const scroll = useRef<ScrollView>(null);
  useScrollToEnd(scroll, clearance.verdict ? clearance.bottom : null);

  return (
    <ScrollView
      ref={scroll}
      testID={`${testID}-scroll`}
      style={styles.scroll}
      contentContainerStyle={[SCROLL_INSET, fixed && styles.fill, contentStyle]}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!fixed}
      {...(keyboardShouldPersistTaps && { keyboardShouldPersistTaps })}
      {...(automaticallyAdjustKeyboardInsets && { automaticallyAdjustKeyboardInsets })}
      {...(onScroll && {
        scrollEventThrottle: SCROLL_THROTTLE_MS,
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) =>
          onScroll(event.nativeEvent.contentOffset.y),
      })}
    >
      <View testID={`${testID}-top-clearance`} style={{ height: clearance.top }} />
      {children}
      <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // A fixed page's content runs the full height between the ends.
  fill: { flexGrow: 1 },
});
