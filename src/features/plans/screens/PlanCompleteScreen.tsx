import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";

export function PlanCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="plan-complete-screen" style={styles.content}>
      <ScreenHeader testID="plan-complete" title="Plan complete" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="plan-complete-share-button"
        label="Share"
        variant="secondary"
        // Mocked action only — no real share sheet in this navigation build.
        onPress={() => undefined}
      />
      <Button
        testID="plan-complete-plans-button"
        label="Plans"
        onPress={() => router.push("/(tabs)/plans")}
      />
      <Button
        testID="plan-complete-add-sermon-button"
        label="Add sermon"
        variant="secondary"
        onPress={() => router.push("/(plan-creation)/paste-sermon")}
      />
      <Button
        testID="plan-complete-home-button"
        label="Home"
        variant="secondary"
        onPress={() => router.push("/(tabs)/home")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
