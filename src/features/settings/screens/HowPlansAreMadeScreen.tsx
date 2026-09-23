import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";
import { SettingsSubpageHeader } from "../components/SettingsSubpageHeader";

export function HowPlansAreMadeScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="how-plans-are-made-screen" style={styles.content}>
      <SettingsSubpageHeader
        testID="how-plans-are-made"
        title="How plans are made"
        onBack={() => router.back()}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
