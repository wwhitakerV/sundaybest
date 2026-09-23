import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { useTheme } from "@/theme";
import { MOCK_PLANS } from "@/features/plans";

export type HomeScreenProps = {
  /**
   * Test-only override for which mocked state to render. Real navigation
   * always uses the derived default (the first incomplete mock plan, if
   * any) — this exists so both the "no active plan" and "active plan"
   * states are exercisable without a separate route for either, per the
   * spec.
   */
  mockHasActivePlan?: boolean;
};

export function HomeScreen({ mockHasActivePlan }: HomeScreenProps = {}) {
  const theme = useTheme();
  const router = useRouter();

  const hasActivePlan = mockHasActivePlan ?? MOCK_PLANS.some((plan) => !plan.completed);
  const activePlan = hasActivePlan ? MOCK_PLANS.find((plan) => !plan.completed) : undefined;

  return (
    <Screen testID="home-tab-screen" style={styles.content}>
      <View style={styles.header}>
        <Text style={[theme.typography.masthead, { color: theme.colors.text }]}>SUNDAYBEST</Text>
        <HeaderIconButton
          testID="home-tab-account-button"
          icon={UserRound}
          accessibilityLabel="Account"
          bordered={false}
          onPress={() => router.push("/(tabs)/settings")}
        />
      </View>

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      {activePlan ? (
        <Pressable
          testID="home-tab-active-plan"
          accessibilityRole="button"
          style={[styles.activePlan, { borderColor: theme.colors.divider }]}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/plans/[planId]",
              params: { planId: activePlan.id },
            })
          }
        >
          <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
            {activePlan.title}
          </Text>
        </Pressable>
      ) : (
        <Button
          testID="home-tab-add-sermon-button"
          label="Add a sermon"
          onPress={() => router.push("/(plan-creation)/paste-sermon")}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activePlan: { padding: 16, borderWidth: 1, borderRadius: 8 },
});
