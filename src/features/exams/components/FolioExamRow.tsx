import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { FOLIO_FONT_CAP } from "./folio-print";

export type FolioExamRowProps = {
  /** "Foundations". */
  level: string;
  title: string;
  /** Whether a rule parts it from the row above. */
  ruled: boolean;
  /** How many lines its title may take before it's cut short: two as designed, one on a compact book. */
  titleLines: 1 | 2;
  testID: string;
};

/**
 * One exam in a subject's book, as print, not a button — the book is the
 * button: its level in the mono, and under it, the full width, its title
 * in the editorial face. Rows share the book's room evenly.
 */
export function FolioExamRow({ level, title, ruled, titleLines, testID }: FolioExamRowProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.row,
        {
          gap: theme.spacing.xs,
          borderTopColor: theme.colors.folioRuleFaint,
          borderTopWidth: ruled ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <Text
        maxFontSizeMultiplier={FOLIO_FONT_CAP}
        style={[theme.typography.folioLevel, styles.level, { color: theme.colors.folioInkFaint }]}
      >
        {level}
      </Text>
      <Text
        numberOfLines={titleLines}
        maxFontSizeMultiplier={FOLIO_FONT_CAP}
        style={[theme.typography.folioItem, { color: theme.colors.folioInk }]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Its share of the book's room, its words from the top of it.
  row: { flex: 1, justifyContent: "center", overflow: "hidden" },
  level: { textTransform: "uppercase" },
});
