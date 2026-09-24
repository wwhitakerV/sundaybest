import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../lift/lift-anchor-context";
import { PasteField } from "../lifts/PasteField";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE, type MockBodyProps } from "./mock-page";

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
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
          Paste a sermon link
        </Text>
      </FadeUp>
      <FadeUp order={1} still={still}>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          Any public sermon video with captions works.
        </Text>
      </FadeUp>

      <FadeUp order={2} still={still}>
        <View style={styles.field}>
          <LiftAnchor id={getLiftId("paste", 0)}>
            <PasteField elapsedMs={elapsedMs} />
          </LiftAnchor>
        </View>
      </FadeUp>

      <FadeUp order={3} still={still}>
        <Text style={[theme.typography.body, styles.hint, { color: theme.colors.textMuted }]}>
          How to copy a link
        </Text>
      </FadeUp>
      <FadeUp order={4} still={still}>
        <View
          style={[
            styles.howTo,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
          ]}
        >
          {HOW_TO_STEPS.map((label, index) => (
            <View
              key={label}
              style={[
                styles.howToRow,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.divider },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: theme.colors.segmentBackground }]}>
                <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>{label}</Text>
            </View>
          ))}
        </View>
      </FadeUp>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 12 },
  hint: { marginTop: 18, marginLeft: 6 },
  howTo: { borderWidth: 1, borderRadius: 28, overflow: "hidden" },
  howToRow: { flexDirection: "row", alignItems: "center", gap: 18, padding: 18 },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
