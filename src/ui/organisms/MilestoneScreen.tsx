import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space } from "@/theme";
import { HERO_RING } from "@/ui/atoms/hero-ring";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { PAGE_INSET, PAGE_TOP } from "./Screen";
import { ScrollScreen } from "./ScrollScreen";

/**
 * The one layout every milestone page shares, set by Day Complete: where the
 * mark sits, and every gap under it. Pages pass content, never spacing.
 */
export const MILESTONE_LAYOUT = {
  /** The mark's top, this far below the top of the safe area — header or not. */
  markTop: 96,
  /** The mark's slot: an `IconRing` or `ProgressRing` fills it; a larger glow spills past it. */
  markSize: HERO_RING.size,
  /** Mark to title, and title to badge. */
  headingGap: space[20],
  /** Title to subtitle. */
  subtitleGap: space[8],
  /** The heading to the content under it. */
  contentTop: space[32],
  /** Between the parts of the content. */
  contentGap: space[16],
  /** Under the content, so it scrolls clear of the footer. */
  contentFoot: space[24],
} as const;

export type MilestoneScreenProps = {
  testID: string;
  /** A close, a title: floated over the top, so it never moves the mark. */
  header?: ReactNode;
  /** What heads the page: an `IconRing`, a `ProgressRing`, a flame. */
  mark: ReactNode;
  title: string;
  /** A line under the title. */
  subtitle?: string;
  /** Set under the heading, as close as the title is to the mark: a streak. */
  badge?: ReactNode;
  /** What the page holds: cards, rows, a picker. */
  children?: ReactNode;
  /** The way on, in the dock at the foot: its one button. */
  footer?: ReactNode;
};

/**
 * A milestone page — a moment between steps that says where things stand:
 * a day done, a plan ready or complete, a plan being prepared, a quiz to
 * start or its score. The mark sits at the same spot on every one, the title
 * and everything under it at the same gaps, the way on at the foot.
 */
export function MilestoneScreen({
  testID,
  header,
  mark,
  title,
  subtitle,
  badge,
  children,
  footer,
}: MilestoneScreenProps) {
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;

  return (
    <ScrollScreen
      testID={testID}
      contentStyle={styles.scroll}
      {...(footer !== undefined && { footer })}
      overlay={
        // Last, so it's drawn — and touched — over the page; floated, so it never moves the mark.
        header ? (
          <View testID={`${testID}-header`} style={[styles.header, { top: insetTop + PAGE_TOP }]}>
            {header}
          </View>
        ) : undefined
      }
    >
      <View testID={`${testID}-body`} style={styles.body}>
        <View testID={`${testID}-heading`} style={styles.heading}>
          <View testID={`${testID}-mark`} style={styles.mark}>
            {mark}
          </View>
          <View testID={`${testID}-titles`} style={styles.titles}>
            <DisplayTitle accessibilityRole="header" style={styles.centred}>
              {title}
            </DisplayTitle>
            {subtitle ? (
              <SFProBody tone="textMuted" style={styles.centred}>
                {subtitle}
              </SFProBody>
            ) : null}
          </View>
          {badge}
        </View>
        {children ? (
          <View testID={`${testID}-content`} style={styles.content}>
            {children}
          </View>
        ) : null}
      </View>
    </ScrollScreen>
  );
}

const layout = MILESTONE_LAYOUT;

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  // The screen's own top padding is above it; this makes up the rest.
  body: { paddingTop: layout.markTop - PAGE_TOP, paddingBottom: layout.contentFoot },
  heading: { alignItems: "center", gap: layout.headingGap },
  mark: {
    width: layout.markSize,
    height: layout.markSize,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: { alignItems: "center", gap: layout.subtitleGap },
  centred: { textAlign: "center" },
  content: { marginTop: layout.contentTop, gap: layout.contentGap },
  header: { position: "absolute", left: PAGE_INSET, right: PAGE_INSET },
});
