import { Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { QuickCheckHeader } from "../components/QuickCheckHeader";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { dayCompleteHref, quickCheckHref } from "../logic/routes";

export function QuickCheckAnswerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = usePlanRouteParams();

  return (
    <Screen testID="quick-check-answer-screen" padded>
      <QuickCheckHeader
        testID="quick-check-answer"
        step={1}
        onClose={() => router.push(dayCompleteHref(planId, day))}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="quick-check-answer-next-question-button"
        label="Next question"
        onPress={() => router.push(quickCheckHref("finish-verse", planId, day))}
      />
    </Screen>
  );
}
