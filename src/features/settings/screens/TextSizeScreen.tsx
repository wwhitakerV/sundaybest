import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";
import { SettingsSubpageHeader } from "../components/SettingsSubpageHeader";

export function TextSizeScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="text-size-screen" style={styles.content}>
      <SettingsSubpageHeader testID="text-size" title="Text size" onBack={() => router.back()} />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
