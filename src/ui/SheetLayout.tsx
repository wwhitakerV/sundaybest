import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { lightTheme } from "@/theme/tokens";
import { SHEET_GRABBER, SheetGrabber } from "./atoms/SheetGrabber";
import { PAGE_INSET } from "./organisms/Screen";

/** The grabber, this far below a form sheet's top edge. */
export const FORM_SHEET_GRABBER_TOP = 7;
/** The title's place below the sheet's top: where it sat under iOS's grabber. */
const TITLE_TOP = 28;

/**
 * The native form sheet a `SheetLayout` is presented in: half the screen
 * tall, with its grabber. A route's `options` in its stack's layout. Its
 * background is set natively, so it's the page's white from its first
 * frame: before the content draws, iOS would otherwise see the dimmed page
 * behind it and draw the grabber light, then switch it dark. The app is
 * light-only for now, so it's the light theme's.
 */
export const HALF_SHEET_OPTIONS = {
  presentation: "formSheet" as const,
  sheetAllowedDetents: [0.5],
  // The sheet draws its own grabber (`SheetGrabber`), sized as every sheet's is.
  sheetGrabberVisible: false,
  contentStyle: { backgroundColor: lightTheme.colors.background },
};

export type SheetLayoutProps = {
  title: string;
  children: ReactNode;
  testID: string;
};

/**
 * What a half-height sheet holds (a route presented as a native form sheet
 * — it draws its own grabber, and a drag down or a tap outside closes it): one
 * scrolling list, its title pinned at the top (`{testID}-header`) and what
 * it holds under it. Nothing sits beside the list: a form sheet lays its
 * scroll view over the whole sheet, and would cover anything placed above
 * it.
 */
export function SheetLayout({ title, children, testID }: SheetLayoutProps) {
  const theme = useTheme();

  return (
    <ScrollView
      testID={testID}
      stickyHeaderIndices={[0]}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
    >
      <View
        testID={`${testID}-header`}
        style={[
          styles.inset,
          {
            backgroundColor: theme.colors.background,
            paddingTop: FORM_SHEET_GRABBER_TOP,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <SheetGrabber testID={`${testID}-grabber`} />
        <Text
          accessibilityRole="header"
          style={[theme.typography.sectionTitle, styles.title, { color: theme.colors.text }]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.inset}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  title: { marginTop: TITLE_TOP - FORM_SHEET_GRABBER_TOP - SHEET_GRABBER.height },
});
