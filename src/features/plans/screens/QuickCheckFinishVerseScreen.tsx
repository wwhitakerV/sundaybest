import { Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { QuickCheckHeader } from "../components/QuickCheckHeader";
import { QuickCheckOptions } from "../components/QuickCheckOptions";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { dayCompleteHref, quickCheckHref } from "../logic/routes";

export function QuickCheckFinishVerseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = usePlanRouteParams();

  return (
    <Screen testID="quick-check-finish-verse-screen" padded>
      <QuickCheckHeader
        testID="quick-check-finish-verse"
        step={2}
        onClose={() => router.push(dayCompleteHref(planId, day))}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <QuickCheckOptions testIDPrefix="quick-check-finish-verse" />

      <Button
        testID="quick-check-finish-verse-check-answer-button"
        label="Check answer"
        onPress={() => router.push(quickCheckHref("score", planId, day))}
      />
    </Screen>
  );
}
