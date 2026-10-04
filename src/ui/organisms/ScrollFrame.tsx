import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { space } from "@/theme";
import { PAGE_INSET, Screen } from "./Screen";

export type ScrollFrameProps = {
  testID: string;
  /** Pinned above the scroll: a step header, a title and its filters. */
  header?: ReactNode;
  /** The full-width scroller, its content inset by `SCROLL_INSET`. */
  children: ReactNode;
  /** Pinned at the foot: a `ScreenFooter`, or a `FeedbackPanel` in its place. */
  footer?: ReactNode;
  /** Over everything, drawn last: a sheet, a floating nav, a floating close. */
  overlay?: ReactNode;
  /** The frame's own extras (room kept clear for a floating nav). */
  style?: StyleProp<ViewStyle>;
};

/** The page inset, on a scroller's content: `ScrollScreen` and `ListScreen` set it. */
export const SCROLL_INSET = { paddingHorizontal: PAGE_INSET } as const;

/**
 * The frame `ScrollScreen` and `ListScreen` share: a screen inset only top
 * and bottom, so its scroller runs the full width, with the page inset on
 * the header and the footer — lining up with the scroller's content.
 */
export function ScrollFrame({
  testID,
  header,
  children,
  footer,
  overlay,
  style,
}: ScrollFrameProps) {
  return (
    <Screen testID={testID} padded="vertical" {...(style && { style })}>
      {header ? (
        <View testID={`${testID}-header`} style={styles.header}>
          {header}
        </View>
      ) : null}

      {children}

      {footer ? (
        // A `FeedbackPanel` here reaches past this inset to the screen's edges.
        <View testID={`${testID}-foot`} style={SCROLL_INSET}>
          {footer}
        </View>
      ) : null}

      {overlay}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Its parts as far apart as the screen's sections.
  header: { ...SCROLL_INSET, gap: space[16] },
});
