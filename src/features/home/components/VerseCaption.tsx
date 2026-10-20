import { StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { SerifBody } from "@/ui/typography/SerifBody";
import { Span } from "@/ui/typography/Span";

/** The short red rule over the line: an epigraph's mark, not a divider. */
const RULE = { width: 24, height: 2 };

/** Held narrow, so the line breaks into a balanced couplet rather than running the page's width. */
const LINE_WIDTH = 280;

export type VerseCaptionProps = { children: string; testID: string };

/**
 * SundayBest's line for the day's verse, set as an epigraph: a short red rule,
 * then the line centred in the Scripture face's italic, held narrow. It closes
 * the verse of the day, under its heart and share.
 */
export function VerseCaption({ children, testID }: VerseCaptionProps) {
  const theme = useTheme();
  return (
    <View testID={testID} style={styles.caption}>
      <View style={[styles.rule, { backgroundColor: theme.colors.accent }]} />
      <SerifBody variant="line" tone="textSupporting" style={styles.line}>
        <Span italic>{children}</Span>
      </SerifBody>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { alignItems: "center", gap: space[16] },
  rule: { width: RULE.width, height: RULE.height },
  line: { maxWidth: LINE_WIDTH, textAlign: "center" },
});
