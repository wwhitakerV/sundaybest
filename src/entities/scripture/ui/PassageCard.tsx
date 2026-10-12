import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { SerifBody } from "@/ui/typography/SerifBody";

/** The quote line down a passage's left: as heavy as the lines that hang a card's pills. */
const QUOTE_LINE = 2;

export type PassageCardProps = {
  /** The verses, as runs of text (their numbers in `MonoLabel variant="emphasis"`). */
  children: ReactNode;
  /** No line: the verses alone, set on whatever they're on (Text size's preview, on its grey). */
  bare?: boolean;
  /** The verses'; the quote around them is `${testID}-quote`. */
  testID?: string;
};

/**
 * A passage of scripture, in the serif reading face, set as a quote: a line
 * down its left in the strong grey, its words in from it, straight on the
 * page. Scripture is the one thing in the Study that's quoted, not written by
 * SundayBest — the line says so, and gives the indent its reason.
 */
export function PassageCard({ children, bare = false, testID }: PassageCardProps) {
  const theme = useTheme();

  if (bare) return <SerifBody testID={testID}>{children}</SerifBody>;
  return (
    <View
      testID={testID && `${testID}-quote`}
      style={[styles.quote, { borderLeftColor: theme.colors.borderStrong, paddingLeft: space[16] }]}
    >
      <SerifBody testID={testID}>{children}</SerifBody>
    </View>
  );
}

const styles = StyleSheet.create({
  quote: { borderLeftWidth: QUOTE_LINE },
});
