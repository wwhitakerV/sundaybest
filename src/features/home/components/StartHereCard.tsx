import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";

export type StartHereCardProps = {
  onAddSermon: () => void;
};

/** Home with no plan under way: start one from last Sunday's sermon. */
export function StartHereCard({ onAddSermon }: StartHereCardProps) {
  const theme = useTheme();

  return (
    <View
      testID="home-tab-start-here"
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.colors.segmentBackground, borderRadius: theme.radii.pill },
        ]}
      >
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>Start here</Text>
      </View>
      <View style={styles.text}>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
          Start with last Sunday&apos;s sermon
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          Paste a link and get a daily plan in seconds.
        </Text>
      </View>
      <Button testID="home-tab-add-sermon-button" label="Add a sermon" onPress={onAddSermon} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 32, padding: 24, gap: 24 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8 },
  text: { gap: 10, marginTop: 20 },
});
