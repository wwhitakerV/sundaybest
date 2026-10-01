import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";

const STEPS = [
  "Open the sermon video",
  "Tap Share, then Copy link",
  "Come back and tap Paste",
] as const;

/** "How to copy a link": three numbered steps. */
export function HowToCopyCard() {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <SFProBody tone="textMuted" style={styles.heading}>
        How to copy a link
      </SFProBody>
      <Card style={styles.card}>
        {STEPS.map((label, index) => (
          <View
            key={label}
            style={[
              styles.row,
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[12], marginTop: space[8] },
  heading: { marginLeft: space[6] },
  card: { overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: space[18], padding: space[18] },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius[12],
    alignItems: "center",
    justifyContent: "center",
  },
});
