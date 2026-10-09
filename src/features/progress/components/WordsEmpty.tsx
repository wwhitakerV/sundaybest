import { StyleSheet, View } from "react-native";
import { NotebookPen } from "lucide-react-native";

import { space } from "@/theme";
import { IconRing } from "@/ui/atoms/IconRing";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Lifted a little above the middle of the room it has, where the eye lands. */
const LIFT = 2 * space[24];

export type WordsEmptyProps = {
  title: string;
  message: string;
};

/**
 * Your words before anything's written: the milestone pages' ring round a
 * notebook and pen, what this place is for, and how it fills — in the middle
 * of the page, lifted a little.
 */
export function WordsEmpty({ title, message }: WordsEmptyProps) {
  return (
    <View testID="your-words-empty" style={[styles.middle, { paddingBottom: LIFT }]}>
      <View style={[styles.block, { gap: space[12] }]}>
        <View style={{ marginBottom: space[8] }}>
          <IconRing testID="your-words-empty-ring" icon={NotebookPen} />
        </View>
        <SFProTitle variant="message" accessibilityRole="header" style={styles.centred}>
          {title}
        </SFProTitle>
        <SFProBody variant="bodyLoose" tone="textMuted" style={styles.centred}>
          {message}
        </SFProBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, justifyContent: "center" },
  block: { alignItems: "center" },
  centred: { textAlign: "center" },
});
