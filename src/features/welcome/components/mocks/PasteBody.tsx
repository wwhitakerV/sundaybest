import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../../logic/lift";
import { PasteField } from "../lifts/PasteField";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE } from "./mock-page-styles";
import type { MockBodyProps } from "../../logic/mock-page";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const HOW_TO_STEPS = [
  "Open the sermon video",
  "Tap Share, then Copy link",
  "Come back and tap Paste",
] as const;
const BADGE_SIZE = 44;

/** New Plan's first step: paste a sermon link, and how to copy one. Its link field lifts off. */
export function PasteBody({ elapsedMs }: MockBodyProps) {
  const theme = useTheme();
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <SFProTitle>Paste a sermon link</SFProTitle>
      </FadeUp>
      <FadeUp order={1} still={still}>
        <SFProBody tone="textMuted">Any public sermon video with captions works.</SFProBody>
      </FadeUp>

      <FadeUp order={2} still={still}>
        <View style={styles.field}>
          <LiftAnchor id={getLiftId("paste", 0)}>
            <PasteField elapsedMs={elapsedMs} />
          </LiftAnchor>
        </View>
      </FadeUp>

      <FadeUp order={3} still={still}>
        <SFProBody tone="textMuted" style={styles.hint}>
          How to copy a link
        </SFProBody>
      </FadeUp>
      <FadeUp order={4} still={still}>
        <Card fill="page" style={styles.howTo}>
          {HOW_TO_STEPS.map((label, index) => (
            <View
              key={label}
              style={[
                styles.howToRow,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.divider },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: theme.colors.segmentBackground }]}>
                <SFProBody variant="listItem">{index + 1}</SFProBody>
              </View>
              <SFProBody>{label}</SFProBody>
            </View>
          ))}
        </Card>
      </FadeUp>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: space[12] },
  hint: { marginTop: space[18], marginLeft: space[6] },
  howTo: { overflow: "hidden" },
  howToRow: { flexDirection: "row", alignItems: "center", gap: space[18], padding: space[18] },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius[12],
    alignItems: "center",
    justifyContent: "center",
  },
});
