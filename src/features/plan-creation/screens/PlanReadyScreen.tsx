import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { SAMPLE_PLAN_ID } from "@/features/plans";
import { requestNotificationPermission } from "../hooks/requestNotificationPermission";

export function PlanReadyScreen() {
  const theme = useTheme();
  const router = useRouter();

  async function handleStart() {
    await requestNotificationPermission();
    router.push({
      pathname: "/(tabs)/plans/[planId]/study",
      params: { planId: SAMPLE_PLAN_ID, day: "1" },
    });
  }

  return (
    <Screen testID="plan-ready-screen" style={styles.content}>
      <ScreenHeader testID="plan-ready" title="Your plan is ready" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="plan-ready-start-button"
        label="Start day 1"
        onPress={() => void handleStart()}
      />
      <Button
        testID="plan-ready-not-now-button"
        label="Not now"
        variant="secondary"
        onPress={() => router.push("/(tabs)/home")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
