import { Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { QuickCheckHeader } from "../components/QuickCheckHeader";
import { QuickCheckOptions } from "../components/QuickCheckOptions";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { dayCompleteHref, quickCheckHref } from "../logic/routes";

export function QuickCheckQuestionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = usePlanRouteParams();

  return (
    <Screen testID="quick-check-question-screen" padded>
      <QuickCheckHeader
        testID="quick-check-question"
        step={1}
        onClose={() => router.push(dayCompleteHref(planId, day))}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <QuickCheckOptions testIDPrefix="quick-check-question" />

      <Button
        testID="quick-check-question-check-answer-button"
        label="Check answer"
        onPress={() => router.push(quickCheckHref("answer", planId, day))}
      />
    </Screen>
  );
}
