import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";
import { SETTINGS_ROWS } from "../logic/settings-rows";

export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="settings-screen" padded>
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>Settings</Text>

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <View>
        {SETTINGS_ROWS.map(({ testID, label, href }) => (
          <Pressable
            key={testID}
            testID={testID}
            accessibilityRole="button"
            style={[styles.row, { borderBottomColor: theme.colors.divider }]}
            onPress={() => {
              if (href) router.push(href);
            }}
          >
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, borderBottomWidth: 1 },
});
