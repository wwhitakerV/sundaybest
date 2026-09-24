import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

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
      <Text style={[theme.typography.body, styles.heading, { color: theme.colors.textMuted }]}>
        How to copy a link
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        {STEPS.map((label, index) => (
          <View
            key={label}
            style={[
              styles.row,
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 8 },
  heading: { marginLeft: 6 },
  card: { borderWidth: 1, borderRadius: 28, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 18, padding: 18 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
