import { Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { SAMPLE_PLAN_ID, studyHref } from "@/features/plans";
import { requestNotificationPermission } from "@/core/notifications/request-notification-permission";

export function PlanReadyScreen() {
  const theme = useTheme();
  const router = useRouter();

  async function handleStart() {
    await requestNotificationPermission();
    router.push(studyHref(SAMPLE_PLAN_ID, 1));
  }

  return (
    <Screen testID="plan-ready-screen" padded>
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
