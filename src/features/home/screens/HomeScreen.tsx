import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { useTheme } from "@/theme";
import { MOCK_PLANS, planOverviewHref } from "@/features/plans";
import { getActivePlan } from "../logic/active-plan";

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
  const activePlan = getActivePlan(MOCK_PLANS, mockHasActivePlan);

  return (
    <Screen testID="home-tab-screen" padded>
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
          onPress={() => router.push(planOverviewHref(activePlan.id))}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activePlan: { padding: 16, borderWidth: 1, borderRadius: 8 },
});
