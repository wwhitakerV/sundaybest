import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";

type Row = {
  testID: string;
  label: string;
  onPress: () => void;
};

export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const rows: readonly Row[] = [
    {
      testID: "settings-daily-reminder-row",
      label: "Daily reminder",
      onPress: () => router.push("/(tabs)/settings/daily-reminder"),
    },
    {
      testID: "settings-bible-translation-row",
      label: "Bible translation",
      onPress: () => router.push("/(tabs)/settings/bible-translation"),
    },
    {
      testID: "settings-text-size-row",
      label: "Text size",
      onPress: () => router.push("/(tabs)/settings/text-size"),
    },
    {
      testID: "settings-how-plans-are-made-row",
      label: "How plans are made",
      onPress: () => router.push("/(tabs)/settings/how-plans-are-made"),
    },
    {
      testID: "settings-privacy-policy-row",
      label: "Privacy policy",
      onPress: () => router.push("/(tabs)/settings/privacy-policy"),
    },
    {
      // Mocked action only — no destination exists for this yet, per spec.
      testID: "settings-contact-support-row",
      label: "Contact support",
      onPress: () => undefined,
    },
  ];

  return (
    <Screen testID="settings-screen" style={styles.content}>
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>Settings</Text>

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <View>
        {rows.map((row) => (
          <Pressable
            key={row.testID}
            testID={row.testID}
            accessibilityRole="button"
            style={[styles.row, { borderBottomColor: theme.colors.divider }]}
            onPress={row.onPress}
          >
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
              {row.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  row: { paddingVertical: 16, borderBottomWidth: 1 },
});
