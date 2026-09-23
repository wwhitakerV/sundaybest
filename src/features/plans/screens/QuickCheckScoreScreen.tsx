import { Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { dayCompleteHref } from "../logic/routes";

export function QuickCheckScoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = usePlanRouteParams();

  return (
    <Screen testID="quick-check-score-screen" padded>
      <ScreenHeader testID="quick-check-score" title="Quick check" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="quick-check-score-done-button"
        label="Done"
        onPress={() => router.push(dayCompleteHref(planId, day))}
      />
    </Screen>
  );
}
