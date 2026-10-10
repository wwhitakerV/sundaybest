import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { space } from "@/theme";
import { IconRing } from "@/ui/atoms/IconRing";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Lifted a little above the middle of the room it has, where the eye lands. */
const LIFT = 2 * space[24];

export type ProgressEmptyProps = {
  /** What the page gathers, in the ring: a notebook, a check. */
  icon: LucideIcon;
  title: string;
  message: string;
  testID: string;
};

/**
 * A Progress page before there's anything in it (Your words, Quick Check):
 * the milestone pages' ring round what it gathers, what this place is for,
 * and how it fills — in the middle of the page, lifted a little.
 */
export function ProgressEmpty({ icon, title, message, testID }: ProgressEmptyProps) {
  return (
    <View testID={testID} style={[styles.middle, { paddingBottom: LIFT }]}>
      <View style={[styles.block, { gap: space[12] }]}>
        <View style={{ marginBottom: space[8] }}>
          <IconRing testID={`${testID}-ring`} icon={icon} />
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
