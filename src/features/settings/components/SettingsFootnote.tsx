import { StyleSheet } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";

/** A card's edge. */
const CARD_EDGE = 1;
/**
 * In from the page's edge as far as the words inside its cards (their 18pt
 * padding and their 1pt edge), so the footnote lines up with them.
 */
const CARD_TEXT_INSET = space[18] + CARD_EDGE;

/** A Settings page's closing line: small, leaded, in the supporting grey, lined up with its cards' words. */
export function SettingsFootnote({ text }: { text: string }) {
  return (
    <SFProBody variant="rowDetail" tone="textSupporting" style={styles.footnote}>
      {text}
    </SFProBody>
  );
}

const styles = StyleSheet.create({
  footnote: { paddingHorizontal: CARD_TEXT_INSET },
});
