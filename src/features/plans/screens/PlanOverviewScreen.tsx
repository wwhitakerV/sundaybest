import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { getMockPlan } from "../mock-plans";

export function PlanOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const plan = getMockPlan(planId);

  if (!plan) return null;

  return (
    <Screen testID="plan-overview-screen" style={styles.content}>
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
        onPress={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/study",
            params: { planId: plan.id, day: String(plan.currentDay) },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
