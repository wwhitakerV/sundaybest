import { Text } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { studyHref } from "../logic/routes";

export function PlanOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { plan } = usePlanRouteParams();

  if (!plan) return null;

  return (
    <Screen testID="plan-overview-screen" padded>
      <ScreenHeader
        testID="plan-overview"
        title={plan.title}
        left={
          <HeaderIconButton
            testID="plan-overview-back-button"
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
        }
        right={
          <HeaderIconButton
            testID="plan-overview-more-button"
            icon={EllipsisVertical}
            accessibilityLabel="More"
            onPress={() => undefined}
          />
        }
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="plan-overview-continue-button"
        label="Continue"
        onPress={() => router.push(studyHref(plan.id, plan.currentDay))}
      />
    </Screen>
  );
}
