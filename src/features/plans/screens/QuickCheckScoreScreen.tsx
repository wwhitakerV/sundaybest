import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";

export function QuickCheckScoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();

  return (
    <Screen testID="quick-check-score-screen" style={styles.content}>
      <ScreenHeader testID="quick-check-score" title="Quick check" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="quick-check-score-done-button"
        label="Done"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/day-complete",
            params: { planId, day },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
